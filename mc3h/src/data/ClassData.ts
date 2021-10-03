/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass, getClassDisplayName, getClassFromDisplayName } from "./CharacterClass";
import { CharacterName, getCharacterFromDisplayName } from "./CharacterName";
import { ClassBaseStats, ClassBonusStats, StatArray, StatUpProbabilities } from "../sim/StatArray";
import { getCharacterTraits } from "./CharacterData";
import { CharacterGenders } from "./CharacterTraits";
import Papa from "papaparse";

import ClassBonusStatsFile from './class_bonus_stats.csv';
import ClassMinStatsFile from './class_min_stats.csv';
import ClassGrowthRatesFile from './class_growth_rates.csv';
import ClassRequirementsFile from './class_requirements.csv';
import { getFetchProvider } from "./FetchProvider";

export interface ClassRequirements
{
    level : number;
    // Some classes are only available to specific genders, e.g. dark mage, pegasus knight
    gender : CharacterGenders | null;
    // Some classes are only available to specific characters.
    characters : Set<CharacterName> | null;
}

export interface ClassData
{
    requirements : ClassRequirements[];
    baseStats : ClassBaseStats;
    // Not caring about dismounted stats.
    bonusStats : ClassBonusStats;
}

const NobleBackgrounds = new Set<CharacterName>([
    CharacterName.Edelgard,
    CharacterName.Hubert,
    CharacterName.Ferdinand,
    CharacterName.Bernadetta,
    CharacterName.Caspar,
    CharacterName.Linhardt,

    CharacterName.Dimitri,
    CharacterName.Felix,
    CharacterName.Annette,
    CharacterName.Sylvain,
    CharacterName.Ingrid,

    CharacterName.Claude,
    CharacterName.Lorenz,
    CharacterName.Hilda,
    CharacterName.Lysithea,
    CharacterName.Marianne,

    CharacterName.Seteth,
    CharacterName.Flayn,
    CharacterName.Hanneman,
    CharacterName.Catherine,
    CharacterName.Gilbert,
    CharacterName.Alois,

    CharacterName.Balthus,
    CharacterName.Constance,

    CharacterName.Jeritza
]);

const CommonerBackgrounds = new Set<CharacterName>([
    CharacterName.BylethMale,
    CharacterName.BylethFemale,

    CharacterName.Dorothea,
    CharacterName.Petra,

    CharacterName.Dedue,
    CharacterName.Mercedes,
    CharacterName.Ashe,

    CharacterName.Raphael,
    CharacterName.Ignatz,
    CharacterName.Leonie,

    CharacterName.Manuela,
    CharacterName.Shamir,
    CharacterName.Cyril,

    CharacterName.Yuri,
    CharacterName.Hapi,

    CharacterName.Anna
]);

const LordBackgrounds = new Set<CharacterName>([
    CharacterName.Claude,
    CharacterName.Dimitri,
    CharacterName.Edelgard
]);

const ProtagonistBackgrounds = new Set<CharacterName>([
    CharacterName.BylethMale,
    CharacterName.BylethFemale
]);

// Special groups of characters as shorthands in the class data files.
const CharacterGroups = new Map<string, Set<CharacterName>>();
CharacterGroups.set("ProtagonistBackgrounds", ProtagonistBackgrounds);
CharacterGroups.set("LordBackgrounds", LordBackgrounds);
CharacterGroups.set("CommonerBackgrounds", CommonerBackgrounds);
CharacterGroups.set("NobleBackgrounds", NobleBackgrounds);

// Initialized with the loadClassData() method.
const ClassRequirementsMap = new Map<CharacterClass, ClassData>();

export function getClassGeneralData(characterClass : CharacterClass) : ClassData
{
    const data = ClassRequirementsMap.get(characterClass);
    if (data === undefined)
    {
        throw new RangeError(`No class data found for class ${CharacterClass[characterClass]}`);
    }
    return data;
}

export function hasClassGeneralData(characterClass : CharacterClass) : boolean
{
    return ClassRequirementsMap.has(characterClass);
}

function prob(growths : StatUpProbabilities)
{
    return growths.map((x) => x * 0.01) as StatUpProbabilities;
}

// Initialized with the loadClassData() method.
const ClassGrowths = new Map<CharacterClass, StatUpProbabilities>();

export function getClassGrowthRateMod(characterClass : CharacterClass) : StatUpProbabilities
{
    const growths = ClassGrowths.get(characterClass);
    if (growths === undefined)
    {
        throw new RangeError(`No growth rates found for class ${CharacterClass[characterClass]}`);
    }
    return growths;
}

export function getRequirementForCharacterAndClass(character : CharacterName, characterClass : CharacterClass) : ClassRequirements | undefined
{
    const requirements = getClassGeneralData(characterClass).requirements;

    // Try to get the lowest level requirement compatible with the character.
    const specificCharacterRequirements = requirements.filter(req => {
        const matchOnGender = req.gender === null || req.gender === getCharacterTraits(character).gender;
        const matchOnSpecificCharacter = req.characters === null || req.characters.has(character);
        return matchOnGender && matchOnSpecificCharacter;
    });

    if (specificCharacterRequirements.length > 0)
    {
        return specificCharacterRequirements.reduce((x,y) => (x.level <= y.level ? x : y));
    }
    else
    {
        // None available
        return undefined;
    }
}

// ================= CHARACTER AND CLASS ELIGIBILITY =================

export function isCharacterEligibleForClass(characterClass : CharacterClass, character : CharacterName, level? : number) : boolean
{
    const requirements = getRequirementForCharacterAndClass(character, characterClass) as ClassRequirements;

    if (requirements === undefined)
    {
        // If no requirements specified, assume data is incomplete and not usable.
        return false;
    }

    if (requirements.characters === null || requirements.characters.has(character))
    {
        if (requirements.gender === null || requirements.gender === getCharacterTraits(character).gender)
        {
            if (level === undefined || requirements.level <= level)
            {
                return true;
            }
        }
    }
    return false;
}

export function getEligibleClasses(character : CharacterName, level? : number) : Set<CharacterClass>
{
    const eligibleClasses = new Set<CharacterClass>();

    for (let i = 0; i < CharacterClass.End; i++)
    {
        const characterClass = i as CharacterClass;
        const requirements = getRequirementForCharacterAndClass(character, characterClass);

        if (requirements === undefined)
        {
            // If no candidate requirements, then we can't use this class.
            // If no requirements period, then assume class is not eligible.
            // Either way, this class isn't eligible.
            continue;
        }

        if (requirements.characters === null || requirements.characters.has(character))
        {
            if (requirements.gender === null || requirements.gender === getCharacterTraits(character).gender)
            {
                if (level === undefined || requirements.level <= level)
                {
                    eligibleClasses.add(characterClass);
                }
            }
        }
    }

    return eligibleClasses;
}

// ================= LOADING DATA FROM CSV FILES =================

function zeroOrNumber(numberAsString : string) : number
{
    if (numberAsString.length === 0)
    {
        return 0;
    }
    else
    {
        return Number.parseInt(numberAsString);
    }
}

const StandardParseConfig = {
    delimiter: ',',
    newline: '\n',
    quoteChar: '"',
    escapeChar: '"',
    header: false,
    dynamicTyping: false,
    worker: false,
    comments: true,
    skipEmptyLines: true
};

async function loadClassBonusStats(dataFile : string) : Promise<Map<CharacterClass,StatArray>>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const bonusStats = new Map<CharacterClass,StatArray>();

    // No schema validation because this data is not meant to be editable, not casually anyway, 
    // so the data file is considered code. Use unit tests to enforce schema compliance.
    // But basic tolerances to deal with Excel's foibles in case they enter the picture.
    const parseResult = Papa.parse(data, StandardParseConfig);
    for (const row of (parseResult.data as Array<string[]>))
    {
        let className : CharacterClass = CharacterClass.End;
        try
        {
            className = getClassFromDisplayName(row[0]);
        }
        catch (e)
        {
            // Rows of empty cells and invalid characters names will get ignored here.
            if (row[0].length > 0)
            {
                console.log(`Bonus stats: failed to look up display name. ${row[0]}`);
            }
            
            continue;
        }

        const statBonuses : StatArray = [
            zeroOrNumber(row[1]),
            zeroOrNumber(row[2]),
            zeroOrNumber(row[3]),
            zeroOrNumber(row[4]),
            zeroOrNumber(row[5]),
            zeroOrNumber(row[6]),
            zeroOrNumber(row[7]),
            zeroOrNumber(row[8]),
            zeroOrNumber(row[9])
        ];

        bonusStats.set(className, statBonuses);
    }

    return bonusStats;
}

async function loadClassMinStats(dataFile : string) : Promise<Map<CharacterClass,StatArray>>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const minStats = new Map<CharacterClass,StatArray>();

    // No schema validation because this data is not meant to be editable, not casually anyway, 
    // so the data file is considered code. Use unit tests to enforce schema compliance.
    // But basic tolerances to deal with Excel's foibles in case they enter the picture.
    const parseResult = Papa.parse(data, StandardParseConfig);
    for (const row of (parseResult.data as Array<string[]>))
    {
        let className : CharacterClass = CharacterClass.End;
        try
        {
            className = getClassFromDisplayName(row[0]);
        }
        catch (e)
        {
            // Rows of empty cells and invalid characters names will get ignored here.
            if (row[0].length > 0)
            {
                console.log(`Base stats: failed to look up display name. ${row[0]}`);
            }

            continue;
        }

        const statLine : StatArray = [
            zeroOrNumber(row[1]),
            zeroOrNumber(row[2]),
            zeroOrNumber(row[3]),
            zeroOrNumber(row[4]),
            zeroOrNumber(row[5]),
            zeroOrNumber(row[6]),
            zeroOrNumber(row[7]),
            zeroOrNumber(row[8]),
            zeroOrNumber(row[9])
        ];

        minStats.set(className, statLine);
    }

    return minStats;
}

export async function loadClassGrowthRates(dataFile : string) : Promise<Map<CharacterClass,StatUpProbabilities>>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const growths = new Map<CharacterClass,StatUpProbabilities>();

    // No schema validation because this data is not meant to be editable, not casually anyway, 
    // so the data file is considered code. Use unit tests to enforce schema compliance.
    // But basic tolerances to deal with Excel's foibles in case they enter the picture.
    const parseResult = Papa.parse(data, StandardParseConfig);
    for (const row of (parseResult.data as Array<string[]>))
    {
        let className : CharacterClass = CharacterClass.End;
        try
        {
            className = getClassFromDisplayName(row[0]);
        }
        catch (e)
        {
            // Rows of empty cells and invalid characters names will get ignored here.
            if (row[0].length > 0)
            {
                console.log(`Growth rates: failed to look up display name. ${row[0]}`);
            }

            continue;
        }

        const growthRates : StatUpProbabilities = prob([
            zeroOrNumber(row[1]),
            zeroOrNumber(row[2]),
            zeroOrNumber(row[3]),
            zeroOrNumber(row[4]),
            zeroOrNumber(row[5]),
            zeroOrNumber(row[6]),
            zeroOrNumber(row[7]),
            zeroOrNumber(row[8]),
            zeroOrNumber(row[9])
        ]);

        growths.set(className, growthRates);
    }

    return growths;
}

function parseGenderRequirement(genderInTable : string) : CharacterGenders | null
{
    if (genderInTable.startsWith("m"))
    {
        return "male";
    }
    else if (genderInTable.startsWith("f"))
    {
        return "female";
    }
    else
    {
        return null;
    }
}

function parseCharacterRequirement(charactersString : string) : Set<CharacterName> | null
{
    if (charactersString.length === 0)
    {
        return null;
    }

    const characterGroupLookup = CharacterGroups.get(charactersString);

    if (characterGroupLookup !== undefined)
    {
        return characterGroupLookup;
    }

    try
    {
        const specificCharacterLookup = getCharacterFromDisplayName(charactersString);
        return new Set<CharacterName>([specificCharacterLookup]);
    }
    catch
    {
        // Failed to find specific character
        console.log(`Failed to match required character string "${charactersString}" to character set.`);
    }
    
    return null;
}

export async function loadClassRequirements(dataFile : string) : Promise<Map<CharacterClass,ClassRequirements[]>>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const requirementsMap = new Map<CharacterClass,ClassRequirements[]>();

    // No schema validation because this data is not meant to be editable, not casually anyway, 
    // so the data file is considered code. Use unit tests to enforce schema compliance.
    // But basic tolerances to deal with Excel's foibles in case they enter the picture.
    const parseResult = Papa.parse(data, StandardParseConfig);
    for (const row of (parseResult.data as Array<string[]>))
    {
        let className : CharacterClass = CharacterClass.End;
        try
        {
            className = getClassFromDisplayName(row[0]);
        }
        catch (e)
        {
            // Rows of empty cells and invalid characters names will get ignored here.
            if (row[0].length > 0)
            {
                console.log(`Class requirements: failed to look up display name. ${row[0]}`);
            }
            continue;
        }

        const requirements : ClassRequirements = {
            level : Number.parseInt(row[1]),
            gender : parseGenderRequirement(row[2]),
            characters : parseCharacterRequirement(row[3])
        };
        
        if (!requirementsMap.has(className))
        {
            requirementsMap.set(className, []);
        }

        // Elide the "undefined" because the line above ensures the entry exists.
        const bucket = requirementsMap.get(className) as ClassRequirements[];
        bucket.push(requirements);
    }

    return requirementsMap;
}

export async function loadClassData() : Promise<void>
{
    const bonusStatMap = await loadClassBonusStats(ClassBonusStatsFile);
    //console.log(bonusStatMap);

    const minStatMap = await loadClassMinStats(ClassMinStatsFile);
    //console.log(minStatMap);

    const growthRateMap = await loadClassGrowthRates(ClassGrowthRatesFile);
    //console.log(growthRateMap);

    const requirementsMap = await loadClassRequirements(ClassRequirementsFile);
    //console.log(requirementsMap);

    // Now assemble the tables
    for (let i = 0; i < CharacterClass.End; i++)
    {
        const characterClass = i as CharacterClass;

        const bonusStats = bonusStatMap.get(characterClass);
        const minStats = minStatMap.get(characterClass);
        const requirements = requirementsMap.get(characterClass);
        const growthRates = growthRateMap.get(characterClass);

        if (bonusStats === undefined || minStats === undefined || requirements === undefined || growthRates === undefined)
        {
            // Single class short on some data
            console.log(`Class ${getClassDisplayName(characterClass)} missing some data. `
                + `Bonus Stats: ${bonusStats !== undefined}, Min Stats: ${minStats === undefined}, `
                + `Requirements: ${requirements === undefined}, Growth Rates: ${growthRates === undefined}`);
        }

        if (bonusStats !== undefined && minStats !== undefined && requirements !== undefined)
        {
            ClassRequirementsMap.set(characterClass, {
                baseStats: minStats,
                bonusStats: bonusStats,
                requirements: requirements
            });
        }

        if (growthRates !== undefined)
        {
            ClassGrowths.set(characterClass, growthRates);
        }
    }
}
