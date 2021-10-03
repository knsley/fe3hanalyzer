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
import { getClassGeneralData, getClassGrowthRateMod, loadClassData } from "../../src/data/ClassData";
import { FetchProvider, useFetchProvider } from "../../src/data/FetchProvider";
import { getAdjustedGrowthRates } from "../../src/sim/AdjustedGrowthRate";
import { GrowthProfile } from "../../src/sim/GrowthProfile";
import { applyClassChanges, applyLevelup, calculateLevelupDistributions, DistributionsByStat, GrowthResultAccumulator, NormalAndAdjustedGrowthRate, precomputeClassChanges, precomputeClassGrowthRates } from "../../src/sim/GrowthResultAccumulator";
import { ProbabilityArray } from "../../src/sim/ProbabilityArray";
import { addProbabilities, forEachStat, forEachStatV, iCHA, iDEF, iDEX, iHP, iLCK, iMAG, iRES, iSPD, iSTR, StatArray, StatUpProbabilities } from "../../src/sim/StatArray";

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

function floatingPointArrayCompare(arr1 : number[], arr2 : number[], digits : number = 4)
{
    expect(arr1.length).toEqual(arr2.length);
    for (let i = 0; i < arr1.length; i++)
    {
        expect(arr1[i]).toBeCloseTo(arr2[i], digits);
    }
}

function compareDistributions(d1 : ProbabilityArray, d2 : ProbabilityArray, digits : number)
{
    expect(d1.minValue).toEqual(d2.minValue);
    expect(d1.maxValue).toEqual(d2.maxValue);

    for (let i = d1.minValue; i <= d1.maxValue; i++)
    {
        expect(d1.getProbability(i)).toBeCloseTo(d2.getProbability(i), digits)
    }
}

function compareStatDistributions(s1 : ProbabilityArray[], s2 : ProbabilityArray[], digits : number)
{
    expect(s1.length).toEqual(9);
    expect(s2.length).toEqual(9);

    for (let i = 0; i < 9; i++)
    {
        compareDistributions(s1[i], s2[i], digits);
    }
}

//#region Internal functional tests to validate intermediate computations.

test("precomputeClassChanges() sanity test", async () => {
    await loadData();

    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [29, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            {class: CharacterClass.Dancer, level: 10},
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.FalconKnight,  level: 30},
        ],
        endLevel : 40
    };

    const compiledClassChanges = precomputeClassChanges(growthProfile);
    expect(compiledClassChanges.length).toBe(growthProfile.endLevel - growthProfile.startLevel + 1);
    
    for (let i = 5; i <= 40; i++)
    {
        let expectedClasses : Array<CharacterClass> = [];
        if (i === 10)
        {
            expectedClasses = [CharacterClass.Dancer, CharacterClass.PegasusKnight];
        }
        else if (i === 30)
        {
            expectedClasses = [CharacterClass.FalconKnight];
        }
        expect(compiledClassChanges[i - growthProfile.startLevel]).toEqual(expectedClasses);
    }
});

test("precomputeClassGrowthRates() sanity test", async () => {
    await loadData();

    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [29, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.FalconKnight,  level: 30},
        ],
        endLevel : 40
    };

    const compiledGrowthRates = precomputeClassGrowthRates(CharacterName.Ingrid, growthProfile);

    // Expect correct list of classes
    expect(new Set<CharacterClass>(compiledGrowthRates.keys()))
        .toEqual(new Set<CharacterClass>([CharacterClass.Soldier, CharacterClass.PegasusKnight, CharacterClass.FalconKnight]));
    
    // Expect correct computation of growth rates.
    const baseGrowthRates : StatUpProbabilities = [0.40, 0.35, 0.35, 0.40, 0.60, 0.45, 0.30, 0.40, 0.45];

    const soldierRates = compiledGrowthRates.get(CharacterClass.Soldier);
    expect(soldierRates).toBeDefined();
    floatingPointArrayCompare((soldierRates as NormalAndAdjustedGrowthRate).normal, addProbabilities(baseGrowthRates, getClassGrowthRateMod(CharacterClass.Soldier) as StatUpProbabilities), 4);

    const pegasusKnightRates = compiledGrowthRates.get(CharacterClass.PegasusKnight);
    expect(pegasusKnightRates).toBeDefined();
    floatingPointArrayCompare((pegasusKnightRates as NormalAndAdjustedGrowthRate).normal, addProbabilities(baseGrowthRates, getClassGrowthRateMod(CharacterClass.PegasusKnight) as StatUpProbabilities), 4);

    const falconKnightRates = compiledGrowthRates.get(CharacterClass.FalconKnight);
    expect(falconKnightRates).toBeDefined();
    floatingPointArrayCompare((falconKnightRates as NormalAndAdjustedGrowthRate).normal, addProbabilities(baseGrowthRates, getClassGrowthRateMod(CharacterClass.FalconKnight) as StatUpProbabilities), 4);
});

// Can't validate the numbers, but can validate the structure. Underlying calculation is verified in StatGrowthTotalCalculator.test.ts
test("calculateLevelupDistributions() should look right structurally", async () => {
    await loadData();

    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [29, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            {class: CharacterClass.Dancer, level: 10},
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.FalconKnight,  level: 30},
        ],
        endLevel : 40
    };

    const cachedGrowths = precomputeClassGrowthRates(CharacterName.Ingrid, growthProfile);
    const computedDistributions = calculateLevelupDistributions(cachedGrowths, false);
    expect(new Set(computedDistributions.keys()))
        .toEqual(new Set([CharacterClass.Soldier, CharacterClass.Dancer, CharacterClass.PegasusKnight, CharacterClass.FalconKnight]));
});

test("applyClassChanges() should make no changes if no class changes are listed", async () => {
    await loadData();

    let baseDistribution = new ProbabilityArray(1, 1);
    baseDistribution.setProbability(1, 1.0);

    const initialDistributions = [
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
    ];

    compareStatDistributions(initialDistributions, applyClassChanges(initialDistributions, []), 4);
});

test("applyClassChanges() should apply correct lower thresholds", async () => {
    await loadData();

    let baseDistribution = new ProbabilityArray(0, 0);
    baseDistribution.setProbability(0, 1.0);

    const initialDistributions = [
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
    ];

    const expectedBaseStats = getClassGeneralData(CharacterClass.Soldier).baseStats;
    const results = applyClassChanges(initialDistributions, [CharacterClass.Soldier])

    forEachStatV(expectedBaseStats, (s, i) => {
        expect(results[i].minValue).toEqual(s);
    });
});

test("applyClassChanges() should apply all class minimums", async () => {
    await loadData();

    let baseDistribution = new ProbabilityArray(0, 0);
    baseDistribution.setProbability(0, 1.0);

    const initialDistributions = [
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
    ];

    const lordBaseStats = getClassGeneralData(CharacterClass.Lord).baseStats;
    const pegasusBaseStats = getClassGeneralData(CharacterClass.PegasusKnight).baseStats;
    const expectedBaseStats = forEachStat(lordBaseStats, (s, i) => Math.max(s, pegasusBaseStats[i]));

    const results = applyClassChanges(initialDistributions, [CharacterClass.Lord, CharacterClass.PegasusKnight])

    forEachStatV(expectedBaseStats, (s, i) => {
        expect(results[i].minValue).toEqual(s);
    });
});

test("applyLevelup() sanity check", async () => {
    await loadData();

    let baseDistribution = new ProbabilityArray(0, 0);
    baseDistribution.setProbability(0, 1.0);

    const initialDistributions = [
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
        baseDistribution.clone(),
    ];

    const growthRates : StatUpProbabilities = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
    const testCaps : StatArray = [100,100,100,100,100,100,100,100,100];

    const levelupDistribution = applyLevelup(initialDistributions, growthRates, testCaps);

    initialDistributions.forEach((v, i) => {
        expect(levelupDistribution[i].getProbability(0)).toBeCloseTo(0.5, 4);
        expect(levelupDistribution[i].getProbability(1)).toBeCloseTo(0.5, 4);
    });
});

//#endregion

// Complex calculation, expect no errors but not really validating results.
test("GrowthResultAccumulator smoke test", async () => {
    await loadData();

    const character = CharacterName.Ingrid;
    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [29, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [
            // Yup let's just throw all of the classes we have into this
            {class: CharacterClass.Dancer, level: 10},
            {class: CharacterClass.PegasusKnight, level: 10},
            {class: CharacterClass.FalconKnight,  level: 30},
        ],
        endLevel : 40
    };

    const sim = new GrowthResultAccumulator(character, growthProfile);
    sim.compute();
});

test("GrowthResultAccumulator test for non-student against known expected values", async () => {
    await loadData();

    // Limit to two levels and a class change to keep things predictable.
    const character = CharacterName.Shamir;
    const growthProfile : GrowthProfile = {
        startLevel : 11,
        startClass : CharacterClass.Sniper,
        startStats : [33, 18, 8, 21, 14, 17, 12, 8, 10],
        changes : [],
        endLevel : 13
    };

    const sim = new GrowthResultAccumulator(character, growthProfile);
    sim.compute();

    const results = sim.getDistributions();

    expect(results.get(13)).toBeDefined();
    const l13Results = results.get(13) as DistributionsByStat;

    const l13Hp = l13Results.hp;
    const l13Dex = l13Results.dex;

    // Math done out in Excel
    expect(new Set(l13Hp.keys())).toEqual(new Set([33,34,35]));
    expect(l13Hp.get(33)).toBeCloseTo(0.3025, 4);
    expect(l13Hp.get(34)).toBeCloseTo(0.495, 4);
    expect(l13Hp.get(35)).toBeCloseTo(0.2025, 4);

    // Math done out in Excel
    expect(new Set(l13Dex.keys())).toEqual(new Set([21,22,23]));
    expect(l13Dex.get(21)).toBeCloseTo(0.0625, 4);
    expect(l13Dex.get(22)).toBeCloseTo(0.375, 4);
    expect(l13Dex.get(23)).toBeCloseTo(0.5625, 4);
});

test("GrowthResultAccumulator test for non-student should reflect expected averages", async () => {
    await loadData();

    // Limit to two levels and a class change to keep things predictable.
    const character = CharacterName.Shamir;
    const growthProfile : GrowthProfile = {
        startLevel : 11,
        startClass : CharacterClass.Sniper,
        startStats : [33, 18, 8, 21, 14, 17, 12, 8, 10],
        changes : [],
        endLevel : 31
    };

    const baseGrowthRates = getCharacterBaseGrowths(character);
    const classGrowthRates = getClassGrowthRateMod(growthProfile.startClass);

    const composedGrowths = addProbabilities(baseGrowthRates, classGrowthRates);

    const sim = new GrowthResultAccumulator(character, growthProfile);
    sim.compute();

    // Spot check two stats
    const levelDifference = growthProfile.endLevel - growthProfile.startLevel;
    const expectedStr = growthProfile.startStats[iSTR] + levelDifference * composedGrowths[iSTR];
    const expectedDef = growthProfile.startStats[iDEF] + levelDifference * composedGrowths[iDEF];

    const results = sim.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;
    const strDistAvg = distributionAverage(results.str);
    const defDistAvg = distributionAverage(results.def);

    // 2 digits of precision to address accumulated error
    expect(strDistAvg).toBeCloseTo(expectedStr, 2);
    expect(defDistAvg).toBeCloseTo(expectedDef, 2);
});

// Simpler calculation, expect known pre-computed values.
test("GrowthResultAccumulator test for student against known expected values", async () => {
    await loadData();

    // Limit to two levels and a class change to keep things predictable.
    const character = CharacterName.Ingrid;
    const growthProfile : GrowthProfile = {
        startLevel : 9,
        startClass : CharacterClass.Soldier,
        startStats : [22, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [{class: CharacterClass.PegasusKnight, level: 10}],
        endLevel : 11
    };

    const sim = new GrowthResultAccumulator(character, growthProfile);
    sim.compute();

    const results = sim.getDistributions();

    expect(results.get(11)).toBeDefined();
    const l11Results = results.get(11) as DistributionsByStat;

    const l11Hp = l11Results.hp;
    const l11Dex = l11Results.dex;

    expect(new Set(l11Hp.keys())).toEqual(new Set([25,26]));
    expect(l11Hp.get(25)).toBeCloseTo(0.453985638, 4);
    expect(l11Hp.get(26)).toBeCloseTo(0.546014362, 4);

    expect(new Set(l11Dex.keys())).toEqual(new Set([10,11,12]));
    expect(l11Dex.get(10)).toBeCloseTo(0.334060762, 4);
    expect(l11Dex.get(11)).toBeCloseTo(0.488810339, 4);
    expect(l11Dex.get(12)).toBeCloseTo(0.177128899, 4);
});

function distributionAverage(distribution : Map<number, number>) : number
{
    let runningAverage = 0.0;

    distribution.forEach((p, v) => {
        runningAverage += p * v;
    });

    return runningAverage;
}

test("GrowthResultAccumulator test for student should reflect expected averages", async () => {
    await loadData();
    
    // Limit to two levels and a class change to keep things predictable.
    const character = CharacterName.Ingrid;
    const growthProfile : GrowthProfile = {
        startLevel : 5,
        startClass : CharacterClass.Soldier,
        startStats : [22, 9, 7, 9, 10, 8, 6, 9, 10],

        changes : [],
        endLevel : 25
    };

    const baseGrowthRates = getCharacterBaseGrowths(character);
    const classGrowthRates = getClassGrowthRateMod(growthProfile.startClass);

    const composedGrowths = getAdjustedGrowthRates(addProbabilities(baseGrowthRates, classGrowthRates));

    const sim = new GrowthResultAccumulator(character, growthProfile);
    sim.compute();

    // Spot check two stats
    const levelDifference = growthProfile.endLevel - growthProfile.startLevel;
    // Check MAG and SPD because one is a beneficiary of the RNG protection and the other isn't.
    const expectedMag = growthProfile.startStats[iMAG] + levelDifference * composedGrowths[iMAG];
    const expectedSpd = growthProfile.startStats[iSPD] + levelDifference * composedGrowths[iSPD];

    const results = sim.getDistributions().get(growthProfile.endLevel) as DistributionsByStat;
    const magDistAvg = distributionAverage(results.mag);
    const spdDistAvg = distributionAverage(results.spd);

    // 2 digits of precision to address accumulated error
    expect(magDistAvg).toBeCloseTo(expectedMag, 2);
    expect(spdDistAvg).toBeCloseTo(expectedSpd, 2);
});

test("Stat gain rate adjuster for students should produce expected values", async() => {
    // Simplified sanity check
    const growthRates : StatUpProbabilities = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
    const adjusted = getAdjustedGrowthRates(growthRates);

    expect(adjusted[iHP]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iSTR]).toBeCloseTo(0.517578125, 3);
    expect(adjusted[iMAG]).toBeCloseTo(0.517578125, 3);
    expect(adjusted[iDEX]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iSPD]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iLCK]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iDEF]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iRES]).toBeCloseTo(0.498046875, 3);
    expect(adjusted[iCHA]).toBeCloseTo(0.498046875, 3);
});
