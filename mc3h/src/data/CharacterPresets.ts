/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Papa from "papaparse";
import { StartingStats, StatArray } from "../sim/StatArray";
import { CharacterClass, getClassFromDisplayName } from "./CharacterClass";
import { CharacterName, getCharacterFromDisplayName } from "./CharacterName";
import { getFetchProvider } from "./FetchProvider";

export interface CharacterInitialData
{
    level : number;
    class : CharacterClass;
    // These are expected to be the composite stats, not the base stats.
    // In other words, these stats are class-dependent.
    stats : StartingStats;
    title? : string;
}

// Shortcuts for players to load common stat blocks, typically known values for recruitment
export const CharacterPresets = new Map<CharacterName, Array<CharacterInitialData>>();

export async function loadCharacterPresetsFromDataFile(dataFile : string) : Promise<void>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const parseConfig = {
        delimiter: ',',
        newline: '', // autodetect
        quoteChar: '"',
        escapeChar: '"',
        header: false,
        dynamicTyping: false,
        worker: false,
        comments: true,
        skipEmptyLines: true
    };

    // No schema validation because this data is not meant to be editable, not casually anyway, 
    // so the data file is considered code. Use unit tests to enforce schema compliance.
    // But basic tolerances to deal with Excel's foibles in case they enter the picture.
    const parseResult = Papa.parse(data, parseConfig);
    for (const row of (parseResult.data as Array<string[]>))
    {
        let characterName : CharacterName = CharacterName.End;
        try
        {
            characterName = getCharacterFromDisplayName(row[0]);
        }
        catch (e)
        {
            // Rows of empty cells and invalid characters names will get ignored here.
            continue;
        }

        const level : number = Number.parseInt(row[1]);
        const characterClass : CharacterClass = getClassFromDisplayName(row[2]);
        const statLine : StatArray = [
            Number.parseInt(row[3]),
            Number.parseInt(row[4]),
            Number.parseInt(row[5]),
            Number.parseInt(row[6]),
            Number.parseInt(row[7]),
            Number.parseInt(row[8]),
            Number.parseInt(row[9]),
            Number.parseInt(row[10]),
            Number.parseInt(row[11])
        ];
        const title : string = row[12];
        
        if (!CharacterPresets.has(characterName))
        {
            CharacterPresets.set(characterName, []);
        }

        // can ignore null case because of the previous condition
        const presetList = CharacterPresets.get(characterName) as CharacterInitialData[];
        presetList.push({
            level: level,
            class: characterClass,
            stats: statLine,
            title: title
        });
    }
}
