/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterName, getCharacterFromDisplayName } from "./CharacterName";
import Papa from "papaparse";
import { getFetchProvider } from "./FetchProvider";

// There are no non-binary recruitable characters. Byleth can be either
// gender, represented as two different characters in the names list.
export type CharacterGenders = "male" | "female";

export interface Traits 
{
    gender : CharacterGenders;
    isStudent : boolean;
};

export const CharacterTraits = new Map<CharacterName, Traits>();

export async function loadCharacterTraitsFromDataFile(dataFile : string) : Promise<void>
{
    const fetchFunc = getFetchProvider().fetch;
    const data = await fetchFunc(dataFile).then(text => text.replaceAll("\r\n","\n"));

    const parseConfig = {
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

        const gender : CharacterGenders = row[1].startsWith("m") ? "male" : "female";
        const isStudent : boolean = row[2].startsWith("t");
        CharacterTraits.set(characterName, {gender: gender, isStudent: isStudent});
    }
}
