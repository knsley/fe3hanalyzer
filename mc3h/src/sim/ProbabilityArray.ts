/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Represents an array of probabilities resembling a binomial distribution of outcomes.
// Used for empirical calculation of simulation steps.
// Note: large difference in magnitude of probability between smallest and largest probabilities
// probably means normalization differences, but those are probably not significant in the
// context of Fire Emblem.

// If drift resulted in total normalization error to exceed certain guardrails, then fail instead of
// continuing to try to normalize.
const NormalizationErrorLimit = 0.01;
const ProbabilityZeroLimit = 0.0001;

function isAlmostZero(n : number) : boolean
{
    return Math.abs(n) <= ProbabilityZeroLimit;
}

export class ProbabilityArray
{
    private offset : number;
    private p : Array<number>;

    public constructor(minValue : number, maxValue : number)
    {
        if (maxValue < minValue)
        {
            throw new RangeError("Expected maxValue to be at least minValue.");
        }

        this.offset = minValue;
        this.p = new Array<number>(maxValue - minValue + 1);
        for (let i = 0, width = this.p.length; i < width; i++)
        {
            this.p[i] = 0;
        }
    }

    public get minValue() : number
    {
        return this.offset;
    }

    public get maxValue() : number
    {
        return this.offset + this.p.length - 1;
    }

    public get width() : number
    {
        return this.p.length;
    }

    // value should be an integer.
    public getProbability(value : number) : number
    {
        const index = value - this.offset;
        if (index < 0 || index > this.p.length)
        {
            throw new RangeError("Value " + value.toString() + " is out of bounds of this probability array.");
        }

        return this.p[index];
    }

    public setProbability(value : number, probability : number) : void
    {
        const index = value - this.offset;
        if (index < 0 || index > this.p.length)
        {
            throw new RangeError("Value " + value.toString() + " is out of bounds of this probability array.");
        }

        this.p[index] = probability;
    }

    public addProbability(value : number, probability : number) : void
    {
        const index = value - this.offset;
        if (index < 0 || index > this.p.length)
        {
            throw new RangeError("Value " + value.toString() + " is out of bounds of this probability array.");
        }

        this.p[index] += probability;
    }

    public clone() : ProbabilityArray
    {
        let p = new ProbabilityArray(this.minValue, this.maxValue);
        for (let i = 0, width = this.p.length; i < width; i++)
        {
            p.setProbability(this.offset + i, this.p[i]);
        }

        return p;
    }

    // shift is a final export adjustment, mostly to handle class bonus stats
    public export(shift : number = 0) : Map<number, number>
    {
        let e = new Map<number, number>();
        for (let i = 0, width = this.p.length; i < width; i++)
        {
            e.set(this.offset + i + shift, this.p[i]);
        }
        return e;
    }

    // Deal with accumulated error by normalizing so that sum of probabilities stays around 1.
    public normalize() : void
    {
        let sum = 0.0;
        this.p.forEach((v) => {sum += v;});

        if (Math.abs(1.0 - sum) < NormalizationErrorLimit)
        {
            let scale = 1.0/sum;
            for (let i = 0, width = this.p.length; i < width; i++)
            {
                this.p[i] *= scale;
            }
        }
        else
        {
            throw new Error("Attempted normalization on a probability array where sum of probabilities was too unusual. Total P is " + sum.toString());
        }
    }

    public clampProbability(lowerBound : number) : ProbabilityArray
    {
        const clampIndex = lowerBound - this.offset;

        if (clampIndex <= 0)
        {
            // Clamping has no effect if lower bound doesn't change anything.
            return this.clone();
        }
        else if (clampIndex >= this.width - 1)
        {
            // Clamping just brings probability up to 1 if lower bound is at/above highest value.
            let p = new ProbabilityArray(lowerBound, lowerBound);
            p.setProbability(lowerBound, 1.0);
            return p;
        }
        else
        {
            // Any intermediate values requires summing up to clamp index.
            let clampedProbability = 0.0;
            for (let i = 0; i <= clampIndex; i++)
            {
                clampedProbability += this.p[i];
            }

            let p = new ProbabilityArray(lowerBound, this.maxValue);
            // Lowest value goes to accumulated total of results up to lower bound.
            p.setProbability(lowerBound, clampedProbability);
            // Rest are cloned.
            for (let i = 1, remainder = this.width - 1 - clampIndex; i <= remainder; i++)
            {
                p.setProbability(lowerBound + i, this.p[clampIndex + i])
            }

            return p;
        }
    }

    // Generates next row of binomial expansion based on a given probability
    // of the stat rising in this step.
    // To be more explicit, for P(x+1, n) where n is the n-th iteration (levelup), and
    // x + 1 is the value (meaning stat == x + 1 after the levelup), then this should be
    // true: P(x+1, n) = P(x+1, n-1) * (1 - pStatUp) + P(x, n-1) * pStatUp
    public stepProbability(pStatUp : number, cap : number) : ProbabilityArray
    {
        if (pStatUp < 0.0 || pStatUp > 1.0)
        {
            throw new RangeError("Invalid value for pStatUp: not a real probability. Value: " + pStatUp.toString());
        }

        if (isAlmostZero(pStatUp))
        {
            return this.clone();
        }
        else if (isAlmostZero(1.0 - pStatUp))
        {
            // In 1.0 case, the stat always goes up.
            let p = new ProbabilityArray(this.minValue + 1, this.maxValue + 1)
            for (let i = 0, width = this.p.length; i < width; i++)
            {
                const index = Math.min(this.offset + i + 1, cap);
                p.addProbability(index, this.p[i]);
            }
            return p;
        }
        else
        {
            // Valid probability, have to calculate because it's nontrivial.
            let p = new ProbabilityArray(this.minValue, this.maxValue + 1)
            let pNotChanged = 1.0 - pStatUp;
            for (let i = 0, width = this.p.length; i < width; i++)
            {
                const thisProb = this.p[i];
                
                // Support for max base stats
                const indexLower = Math.min(this.offset + i, cap);
                const indexUpper = Math.min(this.offset + i + 1, cap);

                p.addProbability(indexLower, thisProb * pNotChanged);
                p.addProbability(indexUpper, thisProb * pStatUp);
            }
            
            return p;
        }
    }
}
