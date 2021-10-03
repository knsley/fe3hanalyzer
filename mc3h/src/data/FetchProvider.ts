/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export interface FetchProvider
{
    fetch(location : string) : Promise<string>
}

export const WebFetchProvider : FetchProvider = 
{
    fetch : async (location : string) => {
        const text = fetch(location).then(
            response => response.text(),
            failure => {throw new Error(failure);}
        )

        return text;
    }
}

let fetchImpl : FetchProvider = WebFetchProvider;

export function getFetchProvider() : FetchProvider
{
    return fetchImpl;
}

export function useFetchProvider(f : FetchProvider) : void
{
    fetchImpl = f;
}