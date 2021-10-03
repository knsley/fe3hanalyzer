/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { StatUpProbabilities } from "../sim/StatArray";
import { CharacterName, getCharacterFromDisplayName } from "./CharacterName";
import Papa from "papaparse";
import { getFetchProvider } from "./FetchProvider";

function prob(growths : StatUpProbabilities) : StatUpProbabilities
{
    return growths.map((x) => x * 0.01) as StatUpProbabilities;
}

export const GrowthRates = new Map<CharacterName, StatUpProbabilities>();

export async function loadCharacterGrowthsFromDataFile(dataFile : string) : Promise<void>
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

        const growths = prob([
            Number.parseInt(row[1]),
            Number.parseInt(row[2]),
            Number.parseInt(row[3]),
            Number.parseInt(row[4]),
            Number.parseInt(row[5]),
            Number.parseInt(row[6]),
            Number.parseInt(row[7]),
            Number.parseInt(row[8]),
            Number.parseInt(row[9])
        ]);
        
        GrowthRates.set(characterName, growths);
    }
}
