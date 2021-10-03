/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass } from "../data/CharacterClass";
import { StatLimitMods } from "../data/CharacterData";
import { CharacterName } from "../data/CharacterName";
import { isCharacterEligibleForClass } from "../data/ClassData";
import { stringToUTF16, toBase64 } from "../lib/EncodingHelper";
import { ClassChange, GrowthProfile } from "../sim/GrowthProfile";
import { StartingStats, StatArray, STAT_COUNT } from "../sim/StatArray";

// Like GrowthProfile, but not like GrowthProfile, in the sense that the CharacterProfile
// allows class changes that are below the starting level or above the end level.
// This has to be reconciled by filtering the class changes when generating the GrowthProfile
// from it.
export interface CharacterProfile
{
    character : CharacterName;
    startLevel : number;
    startClass : CharacterClass;
    startStats : StartingStats;
    // Assume they are in order of application from low to high level, but not necessarily all
    // within the level constraints.
    changes : Array<ClassChange>;
    endLevel : number;
    maxStatMods : StatLimitMods;
}

// What class will a character land on if the analysis ends at a given level?
export function getFinalClassAtLevelForProfile(profile : CharacterProfile, level : number) : CharacterClass
{
    return profile.startClass;
}

function getNormalizedStatString(stats : StatArray) : string
{
    return `[${stats.map(s => s.toString()).join(",")}]`;
}

function getNormalizedClassChangeString(changes : ClassChange[]) : string
{
    const changeStrings = changes.map(c => `(${c.level},${c.class.valueOf().toString()})`);
    return `[${changeStrings.join(",")}]`;
}

function getNormalizedGrowthProfileString(profile : GrowthProfile) : string
{
    const normalizedClassChangeString = getNormalizedClassChangeString(profile.changes);

    return `${profile.startClass.valueOf()}/${profile.startLevel}/${getNormalizedStatString(profile.startStats)}/${profile.endLevel}/${normalizedClassChangeString}`;
}

function getNormalizedStatLimitsString(mods? : StatLimitMods) : string
{
    if (mods === undefined)
    {
        return "{StrSpd:false,LckCha:false,MagDex:false,DefRes:false}";
    }
    else
    {
        return `{StrSpd:${mods.StrAndSpdUp.toString()},LckCha:${mods.LckAndChaUp.toString()},MagDex:${mods.MagAndDexUp.toString()},DefRex:${mods.DefAndResUp.toString()}}`;
    }
}

export async function getCharacterProfileHash(character : CharacterName, profile : GrowthProfile, mods? : StatLimitMods) : Promise<string>
{
    const normalizedProfile = getNormalizedGrowthProfileString(profile);
    const normalizedStatLimits = getNormalizedStatLimitsString(mods);
    const dataString = `${character}|${normalizedProfile}|${normalizedStatLimits}`;
    const data = stringToUTF16(dataString);

    // We don't need secure, we just need functional.
    const digest = await window.crypto.subtle.digest("SHA-1", data);
    return toBase64(digest);
}

export function serializeCharacterProfileToJson(profile : CharacterProfile) : string
{
    return JSON.stringify(profile);
}

export interface ParseCharacterProfileJsonResult
{
    result? : CharacterProfile;
    error? : string;
}

interface FieldDefinition
{
    name : string;
    check : (a : any) => boolean;
}

function isBoundedInteger(x : any, minBoundInclusive : number, maxBoundExclusive? : number) : boolean
{
    if (!Number.isInteger(x))
    {
        return false;
    }
    
    const asInt = x as number;

    if (asInt < minBoundInclusive)
    {
        return false;
    }
    else if (maxBoundExclusive !== undefined && asInt >= maxBoundExclusive)
    {
        return false;
    }

    return true;
}

function isMaxStatModEquivalent(x : any) : boolean
{
    if (!(typeof(x) === 'object'))
    {
        return false;
    }

    const boolFields = ["StrAndSpdUp", "LckAndChaUp", "MagAndDexUp", "DefAndResUp"];
    return boolFields.every(field => (field in x && typeof(x[field]) === 'boolean'));
}

function isClassChangeEquivalent(x : any) : boolean
{
    if (!(typeof(x) === 'object'))
    {
        return false;
    }
    else if (!("level" in x) || !isBoundedInteger(x["level"], 1))
    {
        return false;
    }
    else if (!("class" in x) || !isBoundedInteger(x["class"], 0, CharacterClass.End))
    {
        return false;
    }
    else
    {
        return true;
    }
}

function isCharacterProfileEquivalent(obj : any) : boolean
{
    const fields : FieldDefinition[] = [
        {name: "character", check: x => isBoundedInteger(x, 0, CharacterName.End)},
        {name: "startLevel", check: x => isBoundedInteger(x, 1)},
        {name: "startClass", check: x => isBoundedInteger(x, 0, CharacterClass.End)},
        {name: "startStats", check: (a : any) => Array.isArray(a) && (a as any[]).every(x => isBoundedInteger(x, 0))},
        {name: "endLevel", check: (x) => isBoundedInteger(x, 0)},
        {name: "maxStatMods", check: (x) => isMaxStatModEquivalent(x)},
        {name: "changes", check: (a : any) => Array.isArray(a) && (a as any[]).every(isClassChangeEquivalent)}
    ];

    return fields.every(fieldDefinition => (fieldDefinition.name in obj) && fieldDefinition.check(obj[fieldDefinition.name]));
}

function isValidCharacterName(characterName : CharacterName) : boolean
{
    return Number.isInteger(characterName) && characterName >= 0 && characterName < CharacterName.End;
}

function isValidEndLevel(endLevel : number, startLevel : number) : boolean
{
    return Number.isInteger(endLevel) && endLevel >= startLevel;
}

function isValidStartingStats(startingStats : any) : boolean
{
    if (!Array.isArray(startingStats))
    {
        return false;
    }

    const asArray : any[] = startingStats as any[];

    if (asArray.length !== STAT_COUNT)
    {
        return false;
    }

    if (!asArray.every(x => Number.isInteger(x)))
    {
        return false;
    }

    const asStatArray : StatArray = asArray as StatArray;

    if (!asStatArray.every(x => x >= 0))
    {
        return false;
    }

    return true;
}

function areValidClassChanges(character : CharacterName, classChanges: ClassChange[]) : boolean
{
    // We already know they're all valid class change objects.
    // Just enforce that all class changes should be in increasing level order.
    for (let i = 0; i < classChanges.length - 1; i++)
    {
        if (classChanges[i].level > classChanges[i+1].level)
        {
            return false;
        }
    }

    return classChanges.every(c => isCharacterEligibleForClass(c.class, character, c.level));
}

export function deserializeCharacterProfileFromJson(json : string) : ParseCharacterProfileJsonResult
{
    let parsed : any = null;
    try
    {
        parsed = JSON.parse(json);
    }
    catch
    {
        return {error: "Not valid JSON."};
    }

    // Now validate
    if (typeof(parsed) !== 'object')
    {
        return {error: "Not a valid JSON string."};
    }

    if (!isCharacterProfileEquivalent(parsed))
    {
        return {error: "The JSON does not match the schema for a character code."};
    }

    const asCharacterProfileSchema : CharacterProfile = parsed as CharacterProfile;

    if (!isValidCharacterName(asCharacterProfileSchema.character))
    {
        return {error: "Not a valid character number."};
    }

    if (!isValidEndLevel(asCharacterProfileSchema.endLevel, asCharacterProfileSchema.startLevel))
    {
        return {error: "The end level is lower than the start level."};
    }

    if (!isValidStartingStats(asCharacterProfileSchema.startStats))
    {
        // Might not be a reachable line of code due to validation in isCharacterProfileEquivalent. Oh well.
        return {error: "Invalid starting stats."};
    }

    if (!areValidClassChanges(asCharacterProfileSchema.character, asCharacterProfileSchema.changes))
    {
        return {error: "Out-of-order class changes or invalid level(s) for class change(s)."};
    }

    return {result: parsed};
}
