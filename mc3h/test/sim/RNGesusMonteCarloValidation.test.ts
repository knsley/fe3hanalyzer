/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass } from "../../src/data/CharacterClass";
import { loadCharacterData } from "../../src/data/CharacterData";
import { CharacterName, getCharacterDisplayName } from "../../src/data/CharacterName";
import { loadClassData } from "../../src/data/ClassData";
import { FetchProvider, useFetchProvider } from "../../src/data/FetchProvider";
import { GrowthProfile } from "../../src/sim/GrowthProfile";
import { DistributionsByStat, GrowthResultAccumulator } from "../../src/sim/GrowthResultAccumulator";
import { StatArray } from "../../src/sim/StatArray";
import { computePercentileRankForDistribution, StatPercentileRanks } from "../../src/ui/LuckAnalysisReport";
import { RngesusFormulaSimulationResult, runMonteCarloSimulationForLuckMetric } from "./MonteCarloSim";

// Analysis of how good the approximate calculation for the RNGesus formula is for student and non-student characters.
// Expect the formula to be exact for non-students. For students... who knows.

const fs = require('fs');
const path = require('path');

const TestFetchProvider : FetchProvider = {
    fetch: async function(location : string) : Promise<string> {
        const testPath = path.join(__dirname, "../../src/data", location);
        //console.log(`Loading file: ${testPath}`);
        const fileContents = await fs.readFileSync(testPath, 'utf8');
        return fileContents;
    }
}

let testDataLoaded = false;
async function loadData() {
    if (!testDataLoaded)
    {
        useFetchProvider(TestFetchProvider);
        await loadCharacterData();
        await loadClassData();
        testDataLoaded = true;
    }
}

function computeAnalyticalLuckQuotientComponents(ranks : StatPercentileRanks) : RngesusFormulaSimulationResult
{
    let belowOrSameProduct = 1.0;
    let aboveOrSameProduct = 1.0;

    for (const ranking of ranks.values())
    {
        belowOrSameProduct *= (ranking.below + ranking.same);
        aboveOrSameProduct *= (ranking.above + ranking.same);

    }

    return {
        countEqualOrMore : aboveOrSameProduct,
        countEqualOrLess : belowOrSameProduct,
        sampleSize : 1.0
    }; 
}

function computeAnalyticalRngesusProbabilitySplit(character : CharacterName, growthProfile : GrowthProfile, referenceStats : StatArray)
    : RngesusFormulaSimulationResult
{
    const calc = new GrowthResultAccumulator(character, growthProfile);
    calc.compute();
    const distributions : DistributionsByStat = calc.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;

    const percentileRanks = computePercentileRankForDistribution(referenceStats, distributions);
    return computeAnalyticalLuckQuotientComponents(percentileRanks);
}

function probabilityComponentsAreClose(analyticalResult: RngesusFormulaSimulationResult, 
    simulatedResult: RngesusFormulaSimulationResult, SIM_DELTA: number): boolean 
{
    const normalizedAnalyticalEqOrLower = analyticalResult.countEqualOrLess / analyticalResult.sampleSize;
    const normalizedAnalyticalEqOrHigher = analyticalResult.countEqualOrMore / analyticalResult.sampleSize;

    const analyticalMetric = normalizedAnalyticalEqOrLower / (normalizedAnalyticalEqOrLower + normalizedAnalyticalEqOrHigher);

    const normalizedSampledEqOrLower = simulatedResult.countEqualOrLess / simulatedResult.sampleSize;
    const normalizedSampledEqOrHigher = simulatedResult.countEqualOrMore / simulatedResult.sampleSize;

    const sampledMetric = normalizedSampledEqOrLower / (normalizedSampledEqOrLower + normalizedSampledEqOrHigher);

    console.log(`Analytical result: {${normalizedAnalyticalEqOrLower}, ${normalizedAnalyticalEqOrHigher}} => ${analyticalMetric}`);
    console.log(`Sampled result: {${normalizedSampledEqOrLower}, ${normalizedSampledEqOrHigher}} => ${sampledMetric}`);

    return Math.abs(analyticalMetric - sampledMetric) <= SIM_DELTA;
}

test("Monte Carlo sampled median should be close to center (0.0) on luck metric for student character.", async () => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.01;
    const SAMPLE_SIZE = 1000000;

    // We'll just use Ingrid since she has a pretty cookie cutter class change schedule, meaning this result will be
    // fairly representative. Throw in an extra Wyvern Rider class change just to make the algorithm's job more
    // complicated.
    const character = CharacterName.Ingrid;
    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [29, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.WyvernRider, level: 20},
            {class: CharacterClass.FalconKnight, level: 30}
        ],
        endLevel : 45
    };

    // Compute percentiles
    const calc = new GrowthResultAccumulator(character, growthProfile);
    calc.compute();
    const distributions : DistributionsByStat = calc.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;

    // Get sampled median
    const sortedResults = runMonteCarloSimulationForLuckMetric(character, growthProfile, distributions, SAMPLE_SIZE);

    // If even, return the average of the two central values
    let sampleMedian : number = NaN;

    if (sortedResults.length % 2 == 0)
    {
        const v1 = sortedResults[sortedResults.length/2];
        const v2 = sortedResults[sortedResults.length/2-1];
        sampleMedian = 0.5 * (v1 + v2);
    }
    else
    {
        sampleMedian = sortedResults[sortedResults.length/2];
    }

    console.log(`Sampled median luck metric for ${getCharacterDisplayName(character)}: ${sampleMedian}`);

    // Expect sampled median to be close to 0.
    expect(Math.abs(sampleMedian) <= SIM_DELTA).toBeTruthy();

    // Expect samples population to be center-biased, validate by hand. Because I'm too lazy to automate it.
    const buckets = new Map<number, number>();
    const bucketCount = 11;
    for(const sample of sortedResults)
    {
        const bucket = Math.floor(sample * bucketCount);
        if (!buckets.has(bucket))
        {
            buckets.set(bucket, 0);
        }

        buckets.set(bucket, (buckets.get(bucket) as number) + 1);
    }

    for (const bucket of buckets.keys())
    {
        console.log(`Buckets: ${bucket}:\t${buckets.get(bucket)}`);
    }
})

test("Monte Carlo sampled median should be basically exactly center (0.0) on luck metric for non-student character.", async () => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.001;
    const SAMPLE_SIZE = 1000000;

    // For non-student, we'll use a fairly vanilla Shamir build.
    const character = CharacterName.Shamir;
    const growthProfile : GrowthProfile = {
        startLevel : 11,
        startClass : CharacterClass.Sniper,
        startStats : [33, 18, 8, 21, 14, 17, 12, 8, 10],
        changes : [{level: 30, class: CharacterClass.BowKnight}],
        endLevel : 41
    };

    // Compute percentiles
    const calc = new GrowthResultAccumulator(character, growthProfile);
    calc.compute();
    const distributions : DistributionsByStat = calc.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;

    // Get sampled median
    const sortedResults = runMonteCarloSimulationForLuckMetric(character, growthProfile, distributions, SAMPLE_SIZE);

    // If even, return the average of the two central values
    let sampleMedian : number = NaN;

    if (sortedResults.length % 2 == 0)
    {
        const v1 = sortedResults[sortedResults.length/2];
        const v2 = sortedResults[sortedResults.length/2-1];
        sampleMedian = 0.5 * (v1 + v2);
    }
    else
    {
        sampleMedian = sortedResults[sortedResults.length/2];
    }

    console.log(`Sampled median luck metric for ${getCharacterDisplayName(character)}: ${sampleMedian}`);

    expect(Math.abs(sampleMedian) <= SIM_DELTA).toBeTruthy();
})
