/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Used for sampling random distributions quickly. 
// Needed in order to do Monte Carlo simulations to compute
// total stat count probabilities.

import { ProbabilityArray } from "./ProbabilityArray";

// Uses binomial search under the hood.
// TODO: sort values by probability and look up indirectly to put the smaller
// values near 0 for floating point resolution purposes.
export class SegmentedDistribution
{
    private offset : number;
    private cumulative : Array<number>;

    // Assumes pArray has nonzero probabilities and is normalized.
    public constructor(pArray : ProbabilityArray)
    {
        this.cumulative = new Array<number>(pArray.width + 1);
        
        // The extra 0 value is helpful for binary search algorithm.
        this.offset = pArray.minValue - 1;
        this.cumulative[0] = 0.0;

        let sum = 0.0;
        // Start at 1 because this.offset + 1 is pArray.minValue
        for (let i = 1; i < this.cumulative.length; i++)
        {
            // This results in each array item being the upper bound of the acceptable probability range.
            sum += pArray.getProbability(this.offset + i);
            this.cumulative[i] = sum;
        }

        // Sum will not be exactly 1.0, so fix it because it "should" add up
        // and this makes sure that the actual value of p will always sample successfully.
        this.cumulative[this.cumulative.length - 1] = 1.0;
    }

    public getCumulativeProbabilities() : Array<[number,number]>
    {
        let m = new Array<[number,number]>();
        // Start at 1 because 0 index is a hidden lower bound value.
        for (let i = 1; i < this.cumulative.length; i++)
        {
            m.push([this.offset + i, this.cumulative[i]]);
        }
        return m;
    }

    // Given a p in [0,1] returns the value corresponding to the
    // part of the probability distribution.
    public sample(p : number) : number
    {
        // Early exit condition, pegged to bottom of range means
        // return lowest value, which because of convention (see constructor)
        // is actually 1 more than offset, so we pick the lowest non-zero index.
        if (p === 0.0)
        {
            for (let i = 1; i < this.cumulative.length; i++)
            {
                if (this.cumulative[i] > 0)
                {
                    return this.offset + i;
                }
            }
        }

        // Iterative basic binary search
        // Invariant: p > this.cumulative[lBound] and p <= this.cumulative[rBound]
        let lBound = 0;
        let rBound = this.cumulative.length - 1;
        while (rBound - lBound > 1)
        {
            // since rBound - lBound > 1, that means the rounded midpoint 
            // will always be equal to neither.
            const midpoint = Math.round((rBound + lBound) / 2)
            let pMid = this.cumulative[midpoint];

            if (p > pMid)
            {
                lBound = midpoint;
            }
            else
            {
                rBound = midpoint;
            }
        }

        return this.offset + rBound;
    }
}