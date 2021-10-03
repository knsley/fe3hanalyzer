/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { IStorageProvider } from "../../src/storage/NestedStorageProvider";

export class MockStorageProvider implements IStorageProvider
{
    private data : Map<string,string>;

    public constructor()
    {
        this.data = new Map<string,string>();
    }

    public setItem(key: string, item: string) : void
    {
        this.data.set(key, item);
    }

    public getItem(key: string) : string | null
    {
        const result = this.data.get(key);

        if (result === undefined)
        {
            return null;
        }
        else
        {
            return result;
        }
    }

    public clear() : void
    {
        this.data.clear();
    }
}