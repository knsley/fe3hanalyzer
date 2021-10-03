/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { ProbabilityArray } from "../../src/sim/ProbabilityArray";
import { StatUpProbabilities } from "../../src/sim/StatArray";
import { computeStatGrowthTotalProbabilities } from "../../src/sim/StatGrowthTotalCalculator";

function steppedBinomialComputation(statUps : StatUpProbabilities) : ProbabilityArray
{
    let baseProbability = new ProbabilityArray(0, 0);
    baseProbability.setProbability(0, 1.0);

    let current = baseProbability;
    for (let i = 0; i < statUps.length; i++)
    {
        current = current.stepProbability(statUps[i], 1000);
    }

    current.normalize();
    return current;
}

test("computeStatGrowthTotalProbabilities() should look like stepped accumulation.", () => {
    // Results should look like perfect binomial distribution on 9 terms
    const statUps : StatUpProbabilities = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const cumulative = computeStatGrowthTotalProbabilities(statUps, false);
    const reference = steppedBinomialComputation(statUps);

    for (let i = 0; i <= statUps.length; i++)
    {
        expect(cumulative.getProbability(i)).toBeCloseTo(reference.getProbability(i), 3);
    }
});

test("computeStatGrowthTotalProbabilities() applied to 50% odds should look like 9-term binomial distribution on even odds", () => {
    const statUps : StatUpProbabilities = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const cumulative = computeStatGrowthTotalProbabilities(statUps, false);

    expect(cumulative.getProbability(0)).toBeCloseTo(0.002, 4);
    expect(cumulative.getProbability(1)).toBeCloseTo(0.0176, 4);
    expect(cumulative.getProbability(2)).toBeCloseTo(0.0703, 4);
    expect(cumulative.getProbability(3)).toBeCloseTo(0.1641, 4);
    expect(cumulative.getProbability(4)).toBeCloseTo(0.2461, 4);
    expect(cumulative.getProbability(5)).toBeCloseTo(0.2461, 4);
    expect(cumulative.getProbability(6)).toBeCloseTo(0.1641, 4);
    expect(cumulative.getProbability(7)).toBeCloseTo(0.0703, 4);
    expect(cumulative.getProbability(8)).toBeCloseTo(0.0176, 4);
    expect(cumulative.getProbability(9)).toBeCloseTo(0.002, 4);
});

test("computeStatGrowthTotalProbabilities() should show zero probability below 2 for student.", () => {
    // Results should look like perfect binomial distribution on 9 terms
    const statUps : StatUpProbabilities = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const cumulative = computeStatGrowthTotalProbabilities(statUps, true);
    
    expect(cumulative.minValue > 0 || cumulative.getProbability(0) === 0.0).toBeTruthy();
    expect(cumulative.minValue > 1 || cumulative.getProbability(1) === 0.0).toBeTruthy();
});