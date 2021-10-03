/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterName } from "./CharacterName";
import { iCHA, iDEF, iDEX, iLCK, iMAG, iRES, iSPD, iSTR, StatArray, StatUpProbabilities, subtractStats } from "../sim/StatArray";
import { CharacterClass } from "./CharacterClass";
import { getClassGeneralData } from "./ClassData";
import { CharacterTraits, loadCharacterTraitsFromDataFile, Traits } from "./CharacterTraits";
import { GrowthRates, loadCharacterGrowthsFromDataFile } from "./CharacterGrowths";
import { CharacterMaxStats, loadCharacterMaxStatsFromDataFile } from "./CharacterMaxStats";
import { CharacterInitialData, CharacterPresets, loadCharacterPresetsFromDataFile } from "./CharacterPresets";

import CharacterTraitsFile from "./character_traits.csv";
import CharacterGrowthsFile from "./character_growth_rates.csv";
import CharacterMaxStatsFile from "./character_max_stats.csv";
import CharacterPresetsFile from "./character_presets.csv";

export const CHARACTER_MAX_LEVEL = 99;

export function getCharacterTraits(name : CharacterName) : Traits
{
    const traits = CharacterTraits.get(name);
    if (traits === undefined)
    {
        throw new RangeError(`No character traits entry for ${CharacterName[name]}`);
    }
    return traits;
}

export function getCharacterBaseGrowths(name : CharacterName) : StatUpProbabilities
{
    const growths = GrowthRates.get(name);
    if (growths === undefined)
    {
        throw new RangeError(`Base growth rates not found for ${CharacterName[name]}`);
    }
    return growths;
}

export interface StatLimitMods
{
    StrAndSpdUp : boolean; // Statue of Cichol
    LckAndChaUp : boolean; // Statue of Cethleann
    MagAndDexUp : boolean; // Statue of Macuil
    DefAndResUp : boolean; // Statue of Indech
}

export function getDefaultStatModSetting()
{
    // Default to all true because stat caps are generally uninteresting for playthroughs, 
    // and also most people using this at this point are probably veteran players.
    return {
        StrAndSpdUp: true,
        LckAndChaUp: true,
        MagAndDexUp: true,
        DefAndResUp: true
    };
}

export function getCharacterMaxBaseStats(character : CharacterName, mods? : StatLimitMods)
{
    const maybeMaxStats = CharacterMaxStats.get(character);
    if (maybeMaxStats === undefined)
    {
        throw new RangeError("Character max stats not found.");
    }

    const maxStats = [...maybeMaxStats] as StatArray;
    if (mods?.StrAndSpdUp === true)
    {
        maxStats[iSTR] += 5;
        maxStats[iSPD] += 5;
    }

    if (mods?.LckAndChaUp === true)
    {
        maxStats[iLCK] += 5;
        maxStats[iCHA] += 5;
    }

    if (mods?.MagAndDexUp === true)
    {
        maxStats[iMAG] += 5;
        maxStats[iDEX] += 5;
    }

    if (mods?.DefAndResUp === true)
    {
        maxStats[iDEF] += 5;
        maxStats[iRES] += 5;
    }

    return maxStats;
}


// Handles case where no mod is equivalent to all false
export function areEquivalentStatLimitMods(left? : StatLimitMods, right? : StatLimitMods) : boolean
{
    return !!(left?.StrAndSpdUp) === !!(right?.StrAndSpdUp)
        && !!(left?.LckAndChaUp) === !!(right?.LckAndChaUp)
        && !!(left?.MagAndDexUp) === !!(right?.MagAndDexUp)
        && !!(left?.DefAndResUp) === !!(right?.DefAndResUp);
}

export function getCharacterInitialPresets(name : CharacterName) : CharacterInitialData[]
{
    return CharacterPresets.get(name) ?? [];
}

export function getBaseStatsFromClassStats(stats : StatArray, characterClass : CharacterClass)
{
    const classData = getClassGeneralData(characterClass);
    const boost = classData.bonusStats;
    return subtractStats(stats, boost);
}

export function getCharactersWithDefinedData() : Set<CharacterName>
{
    const charactersWithData : CharacterName[] = [];

    for (let i = 0; i < CharacterName.End; i++)
    {
        const c = i as CharacterName;
        if (CharacterTraits.has(c) && CharacterMaxStats.has(c) && GrowthRates.has(c))
        {
            charactersWithData.push(c);
        }
    }

    return new Set(charactersWithData);
}

export async function loadCharacterData() : Promise<void>
{
    await loadCharacterTraitsFromDataFile(CharacterTraitsFile);
    await loadCharacterGrowthsFromDataFile(CharacterGrowthsFile);
    await loadCharacterMaxStatsFromDataFile(CharacterMaxStatsFile);
    await loadCharacterPresetsFromDataFile(CharacterPresetsFile);
}