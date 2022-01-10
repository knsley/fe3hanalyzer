/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass } from "../../src/data/CharacterClass";
import { getCharacterBaseGrowths, loadCharacterData } from "../../src/data/CharacterData";
import { CharacterName } from "../../src/data/CharacterName";
import { getClassGrowthRateMod, loadClassData } from "../../src/data/ClassData";
import { FetchProvider, useFetchProvider } from "../../src/data/FetchProvider";
import { getAdjustedGrowthRates } from "../../src/sim/AdjustedGrowthRate";
import { GrowthProfile } from "../../src/sim/GrowthProfile";
import { DistributionsByStat, GrowthResultAccumulator } from "../../src/sim/GrowthResultAccumulator";
import { addProbabilities, forEachStatIndex } from "../../src/sim/StatArray";
import { computeStatGrowthTotalProbabilities } from "../../src/sim/StatGrowthTotalCalculator";
import { runMonteCarloAdjustedGrowthRateSimulation, runMonteCarloSimulation, runMonteCarloSingleLevelCountSimulation } from "./MonteCarloSim";

// The god of all correctness tests: run a Monte Carlo simulation, record outcomes, compare to analytical predictions.
// This test suite is expected to take a long-ass time.

const fs = require('fs');
const path = require('path');

const TestFetchProvider : FetchProvider = {
    fetch: async function(location : string) : Promise<string> {
        const testPath = path.join(__dirname, "../../src/data", location);
        console.log(`Loading file: ${testPath}`);
        const fileContents = await fs.readFileSync(testPath, 'utf8');
        return fileContents;
    }
}

let testDataLoaded = false;
async function loadData() {
    if (!testDataLoaded)
    {
        useFetchProvider(TestFetchProvider);
        testDataLoaded = true;
        await loadCharacterData();
        await loadClassData();
    }
}

function distributionsAreClose(simulated : Map<number,number>, computed : Map<number,number>, delta : number) : boolean
{
    const aggregateKeys = new Set(simulated.keys());
    for (const k of computed.keys())
    {
        aggregateKeys.add(k);
    }

    for (const bucket of aggregateKeys)
    {
        const simValue = simulated.get(bucket) ?? 0.0;
        const compValue = computed.get(bucket) ?? 0.0;

        // # Within fixed of result in every bucket
        if (Math.abs(simValue - compValue) > delta)
        {
            console.error("Failed comparison...");
            console.error(simulated);
            console.error(computed);
            return false;
        }
    }

    return true;
}

test("Full computation results should resemble simulation results for a student character", async () => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.001;
    const SAMPLE_SIZE = 2000000;

    const character = CharacterName.Ingrid;
    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [22, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.WyvernRider, level: 20},
            {class: CharacterClass.FalconKnight, level: 30}
        ],
        endLevel : 45
    };

    const calc = new GrowthResultAccumulator(character, growthProfile);
    calc.compute();

    const simulationResult : DistributionsByStat = runMonteCarloSimulation(character, growthProfile, SAMPLE_SIZE);
    const computationResult : DistributionsByStat = calc.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;

    expect(distributionsAreClose(simulationResult.hp, computationResult.hp, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.str, computationResult.str, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.mag, computationResult.mag, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.dex, computationResult.dex, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.spd, computationResult.spd, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.lck, computationResult.lck, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.def, computationResult.def, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.res, computationResult.res, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.cha, computationResult.cha, SIM_DELTA)).toBeTruthy();
});

test("Full computation results should resemble simulation results for a non-student character", async () => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.001;
    const SAMPLE_SIZE = 2000000;

    const character = CharacterName.Shamir;
    const growthProfile : GrowthProfile = {
        startLevel : 11,
        startClass : CharacterClass.Sniper,
        startStats : [33, 18, 8, 21, 14, 17, 12, 8, 10],
        changes : [{level: 30, class: CharacterClass.BowKnight}],
        endLevel : 41
    };

    const calc = new GrowthResultAccumulator(character, growthProfile);
    calc.compute();

    const simulationResult : DistributionsByStat = runMonteCarloSimulation(character, growthProfile, SAMPLE_SIZE);
    const computationResult : DistributionsByStat = calc.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;

    expect(distributionsAreClose(simulationResult.hp, computationResult.hp, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.str, computationResult.str, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.mag, computationResult.mag, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.dex, computationResult.dex, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.spd, computationResult.spd, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.lck, computationResult.lck, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.def, computationResult.def, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.res, computationResult.res, SIM_DELTA)).toBeTruthy();
    expect(distributionsAreClose(simulationResult.cha, computationResult.cha, SIM_DELTA)).toBeTruthy();
});

test("Single level growth rates calculated using adjustedGrowthRates should resemble simulation results for a student character", async () => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const STAT_DELTA = 0.001;
    const SAMPLE_SIZE = 1000000;

    const character : CharacterName = CharacterName.Raphael;
    const characterClass : CharacterClass = CharacterClass.WarMonk;

    const baseGrowthRates = getCharacterBaseGrowths(character);
    const classGrowthRates = getClassGrowthRateMod(characterClass);
    const growthRates = addProbabilities(baseGrowthRates, classGrowthRates);
    
    const computed = getAdjustedGrowthRates(growthRates);
    const simulated = runMonteCarloAdjustedGrowthRateSimulation(growthRates, true, SAMPLE_SIZE);

    expect(forEachStatIndex(index => {
        return Math.abs(simulated[index] - computed[index]) < STAT_DELTA;
    }).every(v => v)).toBeTruthy();
});

test("Single level stat count distributions should resemble simulation results for student characters", async() => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.001;
    const SAMPLE_SIZE = 1000000;

    const character : CharacterName = CharacterName.Raphael;
    const characterClass : CharacterClass = CharacterClass.WarMonk;

    const baseGrowthRates = getCharacterBaseGrowths(character);
    const classGrowthRates = getClassGrowthRateMod(characterClass);
    const growthRates = addProbabilities(baseGrowthRates, classGrowthRates);
    
    const computed = computeStatGrowthTotalProbabilities(growthRates, true).export();
    const simulated = runMonteCarloSingleLevelCountSimulation(growthRates, true, SAMPLE_SIZE);

    expect(distributionsAreClose(computed, simulated, SIM_DELTA)).toBeTruthy();
});

test("Single level stat count distributions should resemble simulation results for non-student characters", async() => {
    await loadData();

    // The idea is that for a given delta from computed values, as sample size approaches infinity the probability
    // that sampled outcomes are within the delta should approach 1. So we just test with a big sample size and an
    // aggressive enough delta. This simulation is very expensive so iteration count is kept down a bit to keep tests
    // from running for too many minutes.
    const SIM_DELTA = 0.001;
    const SAMPLE_SIZE = 1000000;

    const character : CharacterName = CharacterName.Catherine;
    const characterClass : CharacterClass = CharacterClass.Assassin;

    const baseGrowthRates = getCharacterBaseGrowths(character);
    const classGrowthRates = getClassGrowthRateMod(characterClass);
    const growthRates = addProbabilities(baseGrowthRates, classGrowthRates);
    
    const computed = computeStatGrowthTotalProbabilities(growthRates, false).export();
    const simulated = runMonteCarloSingleLevelCountSimulation(growthRates, false, SAMPLE_SIZE);

    expect(distributionsAreClose(computed, simulated, SIM_DELTA)).toBeTruthy();
});