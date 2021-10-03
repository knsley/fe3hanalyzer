/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Remembers progressive growth probability values.
// This is a big pile of data generated for a character based on overall growth profile.

import { CharacterClass, getClassDisplayName } from "../data/CharacterClass";
import { getCharacterBaseGrowths, getBaseStatsFromClassStats, getCharacterMaxBaseStats, StatLimitMods, getCharacterTraits } from "../data/CharacterData";
import { CharacterName } from "../data/CharacterName";
import { getClassGeneralData, getClassGrowthRateMod } from "../data/ClassData";
import { getAdjustedGrowthRates } from "./AdjustedGrowthRate";
import { GrowthProfile } from "./GrowthProfile";
import { ProbabilityArray } from "./ProbabilityArray";
import { iCHA, iDEF, iDEX, iHP, iLCK, iMAG, iRES, iSPD, iSTR, iTOTAL, addProbabilities, StatArray, StatUpProbabilities } from "./StatArray";
import { computeStatGrowthTotalProbabilities } from "./StatGrowthTotalCalculator";

export interface DistributionsByStat
{
    hp : Map<number, number>;
    str : Map<number, number>;
    mag : Map<number, number>;
    dex : Map<number, number>;
    spd : Map<number, number>;
    lck : Map<number, number>;
    def : Map<number, number>;
    res : Map<number, number>;
    cha : Map<number, number>;
    levelupTotal : Map<number, number>;
}

interface StatMedianDetails
{
    pLower : number;
    pHigher : number;
    pMedian : number;
    median : number;
}

export interface NormalAndAdjustedGrowthRate
{
    normal : StatUpProbabilities;
    adjusted : StatUpProbabilities;
}

export function computeDistributionMedianForSingleStat(distribution : DistributionsByStat, index : number) : StatMedianDetails | undefined
{
    const singleStatDistribution = getDistributionByStatIndex(distribution, index);

    let pTotal = Array.from(singleStatDistribution.values()).reduce((a, b) => a + b, 0);
    let pTarget = pTotal * 0.5;

    let cumulativeProbability = 0.0;
    let buckets = Array.from(singleStatDistribution.keys()).sort((a, b) => a - b);
    
    for (let i = 0; i < buckets.length; i++)
    {
        const key = buckets[i];
        const probability = singleStatDistribution.get(key) as number;

        let before = cumulativeProbability;
        let after = cumulativeProbability + probability;

        if (before <= pTarget && after > pTarget)
        {
            return {
                median: key,
                pLower: before,
                pHigher: after,
                pMedian: probability
            };
        }

        cumulativeProbability += probability;
    }

    // No median found
    return undefined;
}

export function getDistributionByStatIndex(distribution : DistributionsByStat, index : number) : Map<number,number>
{
    switch(index)
    {
        case iHP:
            return distribution.hp;
        case iSTR:
            return distribution.str;
        case iMAG:
            return distribution.mag;
        case iDEX:
            return distribution.dex;
        case iSPD:
            return distribution.spd;
        case iLCK:
            return distribution.lck;
        case iDEF:
            return distribution.def;
        case iRES:
            return distribution.res;
        case iCHA:
            return distribution.cha;
        case iTOTAL:
            return distribution.levelupTotal;
        default:
            throw new RangeError(`Unrecognized index ${index} for retrieving distribution for specific stat.`);
    }
}

export type StatDistributionsByLevel = Map<number, DistributionsByStat>;

export function precomputeClassChanges(profile : GrowthProfile) : Array<Array<CharacterClass>>
{
    let levelupMap = new Map<number, Array<CharacterClass>>();

    for (let i = profile.startLevel; i <= profile.endLevel; i++)
    {
        levelupMap.set(i, new Array<CharacterClass>());
    }

    profile.changes.forEach(classChange => {
        const classChanges = levelupMap.get(classChange.level);
        if (classChanges === undefined)
        {
            throw new Error("Error precomputing levelups: variable classChanges is undefined.");
        }
        classChanges.push(classChange.class);
    });

    let computedChanges = new Array<Array<CharacterClass>>();
    for (let i = profile.startLevel; i <= profile.endLevel; i++)
    {
        const level = levelupMap.get(i);
        if (level === undefined)
        {
            throw new Error("Error precomputing levelups: variable level is undefined.");
        }
        computedChanges.push(level);
    }

    return computedChanges;
}

export function precomputeClassGrowthRates(character : CharacterName, profile : GrowthProfile) : Map<CharacterClass, NormalAndAdjustedGrowthRate>
{
    const isStudent = getCharacterTraits(character).isStudent;
    const baseLevelups = getCharacterBaseGrowths(character);

    const cache = new Map<CharacterClass, NormalAndAdjustedGrowthRate>();

    // Start class, we know we need it precomputed.
    const startClassGrowthMod = getClassGrowthRateMod(profile.startClass);
    const startClassRawGrowth = addProbabilities(baseLevelups, startClassGrowthMod)
    const startClassAdjustedGrowths = isStudent ? getAdjustedGrowthRates(startClassRawGrowth) : startClassRawGrowth;
    cache.set(profile.startClass, {
        normal: startClassRawGrowth,
        adjusted: startClassAdjustedGrowths
    });

    profile.changes.forEach(change => {
        if (cache.get(change.class) === undefined)
        {
            const growthMod = getClassGrowthRateMod(change.class);
            const rawGrowths = addProbabilities(baseLevelups, growthMod);
            const adjustedGrowths = isStudent ? getAdjustedGrowthRates(rawGrowths) : rawGrowths;
            cache.set(change.class, {
                normal: rawGrowths,
                adjusted: adjustedGrowths
            });
        }
    });

    return cache;
}

export function calculateLevelupDistributions(cachedGrowths: Map<CharacterClass, NormalAndAdjustedGrowthRate>, isStudent : boolean) 
    : Map<CharacterClass, ProbabilityArray>
{
    let distributions = new Map<CharacterClass, ProbabilityArray>();

    cachedGrowths.forEach((growthRate, className) => {
        if (distributions.get(className) === undefined)
        {
            // Haven't computed this one yet, so compute it.
            distributions.set(className, computeStatGrowthTotalProbabilities(growthRate.normal, isStudent));
        }
    });

    return distributions;
}

export function applyClassChanges(distributions : Array<ProbabilityArray>, classChanges : Array<CharacterClass>) : Array<ProbabilityArray>
{
    if (distributions.length === 0)
    {
        return distributions;
    }
    else
    {
        let newDistributions = [...distributions];

        classChanges.forEach(className => {
            const classBaseStats = getClassGeneralData(className).baseStats;
            for (let i = 0; i < classBaseStats.length; i++)
            {
                newDistributions[i] = newDistributions[i].clampProbability(classBaseStats[i]);
            }
        });

        return newDistributions;
    }
}

export function applyLevelup(distributions : Array<ProbabilityArray>, growthRate : StatUpProbabilities, caps : StatArray) : Array<ProbabilityArray>
{
    const newDistributions = new Array<ProbabilityArray>(distributions.length);

    for (let i = 0; i < growthRate.length; i++)
    {
        newDistributions[i] = distributions[i].stepProbability(growthRate[i], caps[i]);
    }

    return newDistributions;
}

export function exportStatDistributions(stats : Array<ProbabilityArray>, bonusStats : StatArray, growthDistribution : ProbabilityArray) : DistributionsByStat
{
    let normalized = new Array<ProbabilityArray>(9);
    for (let i = 0; i < 9; i++)
    {
        normalized[i] = stats[i].clone();
        normalized[i].normalize();
    }

    return {
        hp:  normalized[0].export(bonusStats[0]),
        str: normalized[1].export(bonusStats[1]),
        mag: normalized[2].export(bonusStats[2]),
        dex: normalized[3].export(bonusStats[3]),
        spd: normalized[4].export(bonusStats[4]),
        lck: normalized[5].export(bonusStats[5]),
        def: normalized[6].export(bonusStats[6]),
        res: normalized[7].export(bonusStats[7]),
        cha: normalized[8].export(bonusStats[8]),
        levelupTotal: growthDistribution.export()
    };
}

export class GrowthResultAccumulator
{
    private perLevel : StatDistributionsByLevel;
    private profile : GrowthProfile;
    private character : CharacterName;

    private cachedLevels : Array<Array<CharacterClass>>;
    private cachedGrowthRates : Map<CharacterClass, NormalAndAdjustedGrowthRate>;

    private isStudent : boolean;

    private statMaximums : StatArray;

    public constructor(character : CharacterName, profile : GrowthProfile, mods? : StatLimitMods)
    {
        this.profile = profile;
        this.character = character;
        this.perLevel = new Map<number, DistributionsByStat>();

        this.cachedLevels = precomputeClassChanges(this.profile);
        this.cachedGrowthRates = precomputeClassGrowthRates(this.character, this.profile);

        this.isStudent = getCharacterTraits(character).isStudent;

        this.statMaximums = getCharacterMaxBaseStats(character, mods);
    }

    // This is a heavy computation!
    public compute() : void
    {
        // Initialize distributions. These are expressed in base stats. Class bonus stats are merged into the results
        // at recording time.
        let distributions = new Array<ProbabilityArray>();
        let baseStartStats = getBaseStatsFromClassStats(this.profile.startStats, this.profile.startClass);

        for (let i = 0; i < baseStartStats.length; i++)
        {
            let startStat = baseStartStats[i];
            let startDistribution = new ProbabilityArray(startStat, startStat);
            startDistribution.setProbability(startStat, 1.0);
            distributions.push(startDistribution);
        }

        const classBasedLevelupDistributions = calculateLevelupDistributions(this.cachedGrowthRates, this.isStudent);

        // Now go level by level.

        // first level, no levelup computation from previous level, but class changes are possible.
        const firstLevelClassChanges = this.cachedLevels[0];
        distributions = applyClassChanges(distributions, firstLevelClassChanges);
        
        let levelFinalClass = firstLevelClassChanges.length > 0 ? firstLevelClassChanges[firstLevelClassChanges.length - 1] : this.profile.startClass;

        const firstLevelupDistribution = classBasedLevelupDistributions.get(levelFinalClass);
        if (firstLevelupDistribution === undefined)
        {
            throw new RangeError("Cached table of levelup total stat distribution is missing entry for character class " + getClassDisplayName(levelFinalClass));
        }

        // Record first level expected stats after all class changes.
        this.recordLevelResults(this.profile.startLevel, distributions, levelFinalClass, firstLevelupDistribution);

        // And now for the rest of the levels.
        const levelSpread = this.profile.endLevel - this.profile.startLevel;
        for (let levelIndex = 1; levelIndex <= levelSpread; levelIndex++)
        {
            // Levelup happens using the final class of the previous level.
            const growthRate = this.cachedGrowthRates.get(levelFinalClass);

            if (growthRate === undefined)
            {
                throw new RangeError("Cached growth rates missing entry for class " + getClassDisplayName(levelFinalClass));
            }

            const actualLevel = this.profile.startLevel + levelIndex;
            const classChanges = this.cachedLevels[levelIndex];

            // Level up based on the final calss of the previous level, then apply class changes for this level, and then present
            // stats based on the final class at this level.
            distributions = applyClassChanges(applyLevelup(distributions, growthRate.adjusted, this.statMaximums), classChanges);
            
            levelFinalClass = classChanges.length > 0 ? classChanges[classChanges.length - 1] : levelFinalClass;
            const levelupDistribution = classBasedLevelupDistributions.get(levelFinalClass);
            if (levelupDistribution === undefined)
            {
                throw new RangeError("Cached table of levelup total stat distribution is missing entry for character class " + getClassDisplayName(levelFinalClass));
            }

            // Store the result at each level.
            this.recordLevelResults(actualLevel, distributions, levelFinalClass, levelupDistribution);
        }
    }

    public getDistributions() : StatDistributionsByLevel
    {
        return this.perLevel;
    }

    private recordLevelResults(actualLevel: number, statDistribution: Array<ProbabilityArray>, 
        levelFinalClass: CharacterClass, levelupDistribution: ProbabilityArray) 
    {
        const bonusStats = getClassGeneralData(levelFinalClass).bonusStats;
        this.perLevel.set(actualLevel, exportStatDistributions(statDistribution, bonusStats, levelupDistribution));
    }
}
