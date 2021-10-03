/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export type JsonIntermediate<T> = {[key : string] : T};

export function convertNumMapToJson(map : Map<number, number>) : JsonIntermediate<string>
{
    let obj : JsonIntermediate<string> = {};

    for (const [k, v] of map)
    {
        obj[k.toString()] = v.toString();
    }

    return obj;
}

export function convertJsonToNumMap(jsonObj : any) : Map<number, number>
{
    let map = new Map<number, number>();

    for (const k in jsonObj)
    {
        map.set(parseFloat(k), parseFloat(jsonObj[k]));
    }

    return map;
}