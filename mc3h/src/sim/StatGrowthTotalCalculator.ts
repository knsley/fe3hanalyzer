/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Takes the array of levelup probabilities and calculates expected total stat growths

import { ProbabilityArray } from "./ProbabilityArray";
import { StatUpProbabilities } from "./StatArray";


function recursivePermutation(index : number, priorProbability : number, currentSum : number, 
    statUpProbabilities : StatUpProbabilities, cumulative : ProbabilityArray) : void
{
    if (index === statUpProbabilities.length)
    {
        // Exit case
        cumulative.addProbability(currentSum, priorProbability);
    }
    else
    {
        const thisLevelupProbability = statUpProbabilities[index];
        recursivePermutation(index + 1, priorProbability * (1.0 - thisLevelupProbability), currentSum, 
            statUpProbabilities, cumulative);
        recursivePermutation(index + 1, priorProbability * thisLevelupProbability, currentSum + 1,
            statUpProbabilities, cumulative);
    }
}

export function computeStatGrowthTotalProbabilities(levelups : StatUpProbabilities, isStudent : boolean) : ProbabilityArray
{
    // Layer 1 is no stats involved.
    let probabilities = new ProbabilityArray(0, levelups.length);
    
    // Go through all 2^n possibilities by recursive permutation.
    // Iterative would be faster, but it's 2^9, if perf is an issue then we're doing something horribly wrong.
    recursivePermutation(0, 1.0, 0, levelups, probabilities);
    probabilities.normalize();

    // If it's a student, it has "RNG protection" which guarantees at least two stats go up.
    if (isStudent)
    {
        probabilities = probabilities.clampProbability(2);
    }

    return probabilities;
}
