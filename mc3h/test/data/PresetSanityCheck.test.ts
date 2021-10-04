/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { loadCharacterData } from "../../src/data/CharacterData";
import { CharacterName, getCharacterDisplayName } from "../../src/data/CharacterName";
import { loadInitialStatsPresets } from "../../src/data/CharacterPresetLoader";
import { getClassGeneralData, loadClassData } from "../../src/data/ClassData";
import { FetchProvider, useFetchProvider } from "../../src/data/FetchProvider";
import { forEachStatIndex, subtractStats } from "../../src/sim/StatArray";

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

test("Presets' base stats are monotonically increasing and do not increase more than 1 stat per level.", async () => {
    await loadData();

    const bundle = loadInitialStatsPresets();

    let failedCheck = false;

    for (let i = 0; i < CharacterName.End; i++)
    {
        const character = getCharacterDisplayName(i);
        const presets = bundle.getPresetsForCharacter(i).filter(p => {
            // Exclude Cindered Shadows because they're special cases.
            return p.displayName.search(/Cindered\ Shadows/i) === -1
        });

        if (presets.length <= 1)
        {
            console.log(`Skip character ${character} because of <= 1 non-Cindered-Shadows preset.`);
        }
        else
        {
            // Sort levels in increasing order.
            const sortedPresets = [...presets].sort((a,b) => a.stats.level - b.stats.level);
            for (let pIndex = 1; pIndex < sortedPresets.length; pIndex++)
            {
                const lowerPreset = sortedPresets[pIndex-1];
                const lowerStats = lowerPreset.stats.stats;
                const lowerLevel = lowerPreset.stats.level;

                const upperPreset = sortedPresets[pIndex];
                const upperStats = upperPreset.stats.stats;
                const upperLevel = upperPreset.stats.level;

                if (upperPreset.stats.class !== lowerPreset.stats.class)
                {
                    // Class changes are common place where the pattern fails despite correct stats.
                    continue;
                }

                const monotonicAndPossible = forEachStatIndex(statIndex => {
                    const lStat = lowerStats[statIndex];
                    const uStat = upperStats[statIndex];

                    return (lStat <= uStat) && (uStat - lStat <= upperLevel - lowerLevel);
                });

                if (!monotonicAndPossible.every(x => x))
                {
                    console.error(`Failed monotonicity/plausibility check: character ${character} preset "${lowerPreset.displayName}" -> preset "${upperPreset.displayName}"`);
                    failedCheck = true;
                }
            }
        }
    }

    expect(failedCheck).toBeFalsy();
});