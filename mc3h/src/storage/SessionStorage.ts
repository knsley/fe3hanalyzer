/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { StatLimitMods } from "../data/CharacterData";
import { CharacterName } from "../data/CharacterName";
import { getCharacterProfileHash } from "../model/CharacterProfile";
import { GrowthProfile } from "../sim/GrowthProfile";
import { DistributionsByStat, StatDistributionsByLevel } from "../sim/GrowthResultAccumulator";
import { convertJsonToNumMap, convertNumMapToJson, JsonIntermediate } from "./JsonHelper";
import { IStorageProvider, NestedStorageProvider } from "./NestedStorageProvider";

const STORAGE_KEY_CACHED_ANALYSIS_RESULT = "cached_analyses";
const DEFAULT_CACHED_ANALYSIS_PROVIDER = new NestedStorageProvider(STORAGE_KEY_CACHED_ANALYSIS_RESULT, window.sessionStorage);

function convertDistributionToJson(data : DistributionsByStat) : JsonIntermediate<JsonIntermediate<string>>
{
    return {
        hp : convertNumMapToJson(data.hp),
        str : convertNumMapToJson(data.str),
        mag : convertNumMapToJson(data.mag),
        dex : convertNumMapToJson(data.dex),
        spd : convertNumMapToJson(data.spd),
        lck : convertNumMapToJson(data.lck),
        def : convertNumMapToJson(data.def),
        res : convertNumMapToJson(data.res),
        cha : convertNumMapToJson(data.cha),
        levelupTotal : convertNumMapToJson(data.levelupTotal),
    };
}

function convertAnalysisResultToJson(data : StatDistributionsByLevel) : JsonIntermediate<JsonIntermediate<JsonIntermediate<string>>>
{
    let obj : JsonIntermediate<JsonIntermediate<JsonIntermediate<string>>> = {};

    for (const [k, v] of data)
    {
        obj[k.toString()] = convertDistributionToJson(v);
    }

    return obj;
}

function convertJsonToDistribution(jsonObj : any) : DistributionsByStat
{
    return {
        hp : convertJsonToNumMap(jsonObj.hp),
        str : convertJsonToNumMap(jsonObj.str),
        mag : convertJsonToNumMap(jsonObj.mag),
        dex : convertJsonToNumMap(jsonObj.dex),
        spd : convertJsonToNumMap(jsonObj.spd),
        lck : convertJsonToNumMap(jsonObj.lck),
        def : convertJsonToNumMap(jsonObj.def),
        res : convertJsonToNumMap(jsonObj.res),
        cha : convertJsonToNumMap(jsonObj.cha),
        levelupTotal : convertJsonToNumMap(jsonObj.levelupTotal),
    };
}

function convertJsonToAnalysisResult(jsonObj : any) : StatDistributionsByLevel
{
    let map = new Map<number, DistributionsByStat>();

    for (const k in jsonObj)
    {
        map.set(parseInt(k), convertJsonToDistribution(jsonObj[k]));
    }

    return map;
}

export async function setCachedAnalysisResult(data : StatDistributionsByLevel,
    character : CharacterName, profile : GrowthProfile, mods? : StatLimitMods, 
    provider : IStorageProvider = DEFAULT_CACHED_ANALYSIS_PROVIDER) : Promise<void>
{
    const hash = await getCharacterProfileHash(character, profile, mods);
    const obj = convertAnalysisResultToJson(data);
    provider.setItem(hash, JSON.stringify(obj));
}

export async function getCachedAnalysisResult(character : CharacterName, profile : GrowthProfile, mods? : StatLimitMods,
    provider : IStorageProvider = DEFAULT_CACHED_ANALYSIS_PROVIDER) : Promise<StatDistributionsByLevel | null>
{
    const hash = await getCharacterProfileHash(character, profile, mods);
    const json = provider.getItem(hash);

    if (json === null)
    {
        return null;
    }
    else
    {
        return convertJsonToAnalysisResult(JSON.parse(json));
    }
}