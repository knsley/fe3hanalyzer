/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import seedrandom from "seedrandom";
import { CharacterClass } from "../../src/data/CharacterClass";
import { getBaseStatsFromClassStats, getCharacterBaseGrowths, getCharacterTraits } from "../../src/data/CharacterData";
import { CharacterName } from "../../src/data/CharacterName";
import { getClassGeneralData, getClassGrowthRateMod } from "../../src/data/ClassData";
import { GrowthProfile } from "../../src/sim/GrowthProfile";
import { DistributionsByStat, getDistributionByStatIndex } from "../../src/sim/GrowthResultAccumulator";
import { addProbabilities, forEachStat, forEachStatIndex, forEachStatV, iTOTAL, StatArray, statTotal, StatUpProbabilities } from "../../src/sim/StatArray";


function simulateLevelup(statsBuffer : StatArray, character : CharacterName, characterClass : CharacterClass, rng : seedrandom.prng) : void
{
    const baseGrowth = getCharacterBaseGrowths(character);
    const classGrowths = getClassGrowthRateMod(characterClass);
    const isStudent = getCharacterTraits(character).isStudent;

    // No adjusted rates, we simulate it hard-coded.
    const growthRates = addProbabilities(baseGrowth, classGrowths);

    let statUps : StatArray = forEachStat(growthRates, p => {
        return rng.double() <= p ? 1 : 0;
    });

    // simulate RNG protection
    if (isStudent && statTotal(statUps) < 2)
    {
        statUps = [0,1,1,0,0,0,0,0,0];
    }

    forEachStatV(statUps, (s, i) => {
        statsBuffer[i] += s;
    });
}

function simulateClassChange(statsBuffer : StatArray, currentClass : CharacterClass, nextClass : CharacterClass) : void
{
    // Get base stats
    const baseStats = getBaseStatsFromClassStats(statsBuffer, currentClass);
    
    const classGeneralData = getClassGeneralData(nextClass);
    const minStats = classGeneralData.baseStats;
    const statMod = classGeneralData.bonusStats;

    // Clamp base stats to min stats of next class
    const clamped = forEachStat(baseStats, (s, i) => Math.max(s, minStats[i]));

    // Reapply bonus stats from new class
    forEachStatIndex(i => {
        statsBuffer[i] = clamped[i] + statMod[i];
    });
}

// Final stat array includes class bonus stats.
function runProfileSimulation(character : CharacterName, growthProfile : GrowthProfile, rng : seedrandom.prng) : StatArray
{
    // Now we know which class changes to apply at each level.
    const levelups = new Map<number, CharacterClass[]>();
    growthProfile.changes.forEach(v => {
        if (!levelups.has(v.level))
        {
            levelups.set(v.level, []);
        }

        (levelups.get(v.level) as CharacterClass[]).push(v.class);
    });

    const currentStats : StatArray = [...growthProfile.startStats];
    let currentClass = growthProfile.startClass;
    for (let level = growthProfile.startLevel + 1; level <= growthProfile.endLevel; level++)
    {
        // Do previous levelup
        simulateLevelup(currentStats, character, currentClass, rng);
        
        for (const classChange of (levelups.get(level) ?? []))
        {
            simulateClassChange(currentStats, currentClass, classChange);
            currentClass = classChange;
        }
    }

    return currentStats;
}

export function runMonteCarloSimulation(character : CharacterName, growthProfile : GrowthProfile, sampleSize : number = 50000, seed : number = 23984619) : DistributionsByStat
{
    const rng = seedrandom(seed.toString());

    const distributions : DistributionsByStat = {
        hp :  new Map<number, number>(),
        str : new Map<number, number>(),
        mag : new Map<number, number>(),
        dex : new Map<number, number>(),
        spd : new Map<number, number>(),
        lck : new Map<number, number>(),
        def : new Map<number, number>(),
        res : new Map<number, number>(),
        cha : new Map<number, number>(),
        // Ignore levelup total, test it separately.
        levelupTotal : new Map<number, number>()
    }

    for (let i = 0; i < sampleSize; i++)
    {
        const result : StatArray = runProfileSimulation(character, growthProfile, rng);

        forEachStatV(result, (statValue, statIndex) => {
            const d = getDistributionByStatIndex(distributions, statIndex);
            // Increment probability map.
            const cumulativeCount = (d.get(statValue) ?? 0) + 1;
            d.set(statValue, cumulativeCount);
        });
    }

    // Normalize late for numerical precision
    forEachStatIndex<void>(index => {
        const d = getDistributionByStatIndex(distributions, index);
        for (const k of d.keys())
        {
            d.set(k, (d.get(k) as number) / sampleSize);
        }
    })

    return distributions;
}

export function runMonteCarloAdjustedGrowthRateSimulation(growths : StatUpProbabilities, isStudent : boolean, sampleSize : number = 1000000, seed = 239047) : StatUpProbabilities
{
    const rng = seedrandom(seed.toString());
    const statUps : StatArray = [0,0,0,0,0,0,0,0,0];

    for (let iteration = 0; iteration < sampleSize; iteration++)
    {
        let stats : StatArray = forEachStat(growths, p => {
            return rng.double() <= p ? 1 : 0;
        });

        // The crux of the simulation
        if(isStudent && statTotal(stats) < 2)
        {
            stats = [0,1,1,0,0,0,0,0,0];
        }
        
        forEachStatV(stats, (s, i) => {
            statUps[i] += s;
        });
    }

    return forEachStat(statUps, (s, i) => (s / sampleSize));
}

export function runMonteCarloSingleLevelCountSimulation(growths : StatUpProbabilities, isStudent : boolean, sampleSize : number = 1000000, seed = 239047) : Map<number, number>
{
    const rng = seedrandom(seed.toString());
    const dist = new Map<number, number>();

    for (let iteration = 0; iteration < sampleSize; iteration++)
    {
        let stats : StatArray = forEachStat(growths, p => {
            return rng.double() <= p ? 1 : 0;
        });

        let count = statTotal(stats);
        
        if (count < 2 && isStudent)
        {
            count = 2;
        }

        if (!dist.has(count))
        {
            dist.set(count, 0);
        }

        dist.set(count, (dist.get(count) as number) + 1.0/sampleSize);
    }

    return dist;
}