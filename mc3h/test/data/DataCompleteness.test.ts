/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass, getCharacterClassCategories, getCharacterClassesByCategory, getClassDisplayName } from "../../src/data/CharacterClass";
import { getCharacterBaseGrowths, getCharacterInitialPresets, getCharacterMaxBaseStats, getCharacterTraits, loadCharacterData } from "../../src/data/CharacterData";
import { CharacterName, getCharacterDisplayName, getCharacterFactions, getCharactersByFaction } from "../../src/data/CharacterName";
import { getClassGeneralData, getClassGrowthRateMod, isCharacterEligibleForClass, loadClassData } from "../../src/data/ClassData";
import { FetchProvider, useFetchProvider } from "../../src/data/FetchProvider";

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

console.info(`Working directory for test file fetching: ${__dirname}`);

test("All character names are categorized", async () => {
    await loadData();

    const categorized = new Set<CharacterName>();

    let repeated = false;
    for(const name of Array.from(getCharacterFactions()).flatMap(f => getCharactersByFaction(f)))
    {
        if (categorized.has(name))
        {
            repeated = true;
        }
        categorized.add(name);
    }
    expect(repeated).toBe(false);

    let missingName = false;
    for (let i = 0; i < CharacterName.End; i++)
    {
        if (!categorized.has(i as CharacterName))
        {
            missingName = true;
            break;
        }
    }
    expect(missingName).toBe(false);
});

test("All character classes are categorized", async () => {
    await loadData();

    const categorized = new Set<CharacterClass>();

    let repeated = false;
    for(const c of Array.from(getCharacterClassCategories()).flatMap(cat => getCharacterClassesByCategory(cat)))
    {
        if (categorized.has(c))
        {
            repeated = true;
        }
        categorized.add(c);
    }
    expect(repeated).toBe(false);

    let missingClass = false;
    for (let i = 0; i < CharacterClass.End; i++)
    {
        if (!categorized.has(i as CharacterClass))
        {
            missingClass = true;
            break;
        }
    }
    expect(missingClass).toBe(false);
});

test("All characters have data", async () => {
    await loadData();

    let all : boolean[] = [];

    for (let i = 0; i < CharacterName.End; i++)
    {
        const name = i as CharacterName;
        
        try
        {
            getCharacterTraits(i);
            getCharacterBaseGrowths(i);
            getCharacterMaxBaseStats(i);
        }
        catch
        {
            all.push(false);
            console.error(`Missing character data: ${getCharacterDisplayName(name)}`);
            continue;
        }

        all.push(true);
    }

    expect(all.every(x => x)).toBe(true);
});

test("All characters have at least one preset", async () => {
    await loadData();

    let all : boolean[] = [];

    for (let i = 0; i < CharacterName.End; i++)
    {
        const name = i as CharacterName;
        if (getCharacterInitialPresets(name).length > 0)
        {
            all.push(true);
        }
        else
        {
            console.error(`Missing default character preset: ${getCharacterDisplayName(name)}`)
            all.push(false);
        }
    }

    expect(all.every(x => x)).toBe(true);
});

test("All classes have data", async () => {
    await loadData();

    let all : boolean[] = [];

    for (let i = 0; i < CharacterClass.End; i++)
    {
        const c = i as CharacterClass;

        try
        {
            getClassGeneralData(c);
            getClassGrowthRateMod(c);
        }
        catch
        {
            all.push(false);
            console.error(`Missing class data: ${getClassDisplayName(c)}`)
            continue;
        }

        all.push(true);
    }

    expect(all.every(x => x)).toBe(true);
});

test("All characters are either of Noble or Commoner background", async () => {
    await loadData();

    let all : boolean[] = [];

    for (let i = 0; i < CharacterName.End; i++)
    {
        const c = i as CharacterName;

        if (isCharacterEligibleForClass(CharacterClass.Noble, c) || isCharacterEligibleForClass(CharacterClass.Commoner, c))
        {
            all.push(true);
        }
        else
        {
            console.error(`Character missing Commoner/Noble class background: ${getCharacterDisplayName(c)}`);
            all.push(false);
        }
    }

    expect(all.every(x => x)).toBe(true);
});