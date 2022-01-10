/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { forEachStat, forEachStatIndex, StatArray, StatUpProbabilities } from "./StatArray";

const guaranteedLowStatUpStats : StatArray = [0,1,1,0,0,0,0,0,0];

export function computeZeroOtherwiseProbabilities(rawGrowthRate : StatUpProbabilities) : StatUpProbabilities
{
    const oneMinus = forEachStat(rawGrowthRate, x => (1.0-x));

    // Do it the slow way, do it faster if this isn't performant enough.
    return forEachStatIndex(index => {
        return oneMinus
            .map((n, i) => i === index ? 1.0 : n)
            .reduce((a,b) => a*b);
    }) as StatUpProbabilities;
}

export function computeZeroOrOneStatUpProbability(rawGrowthRate : StatUpProbabilities, pZeroOtherwise : StatUpProbabilities) : number
{
    const oneMinus = forEachStat(rawGrowthRate, x => (1.0-x));
    const zeroStatsUp = oneMinus.reduce((a, b) => a * b);
    const oneStatUp = rawGrowthRate.map((p, i) => p * pZeroOtherwise[i]);
    return zeroStatsUp + oneStatUp.reduce((p, c) => p + c);
}

// Students have bad RNG protection: if their levelup would have given them 0 or 1 stat up, they will gain 2 instead.
export function getAdjustedGrowthRates(rawGrowthRate : StatUpProbabilities) : StatUpProbabilities
{
    // Probability that all other stats, other than the specified index, do not go up
    const pZeroOtherwise : StatUpProbabilities = computeZeroOtherwiseProbabilities(rawGrowthRate);
    const pZeroOrOneTotal : number = computeZeroOrOneStatUpProbability(rawGrowthRate, pZeroOtherwise);

    const adjustedStats = forEachStatIndex(index => {
        const pUp = rawGrowthRate[index];
        return pUp * (1 - pZeroOtherwise[index]) + guaranteedLowStatUpStats[index] * pZeroOrOneTotal;
    }) as StatUpProbabilities;

    return adjustedStats;
}