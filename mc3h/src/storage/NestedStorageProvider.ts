/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export interface IStorageProvider
{
    setItem(key: string, item: string) : void;
    getItem(key: string) : string | null;
    clear() : void;
}

// Redirects storage calls into a sub-oject in the storage provider.
export class NestedStorageProvider implements IStorageProvider
{
    private subKey : string;
    private rootProvider : IStorageProvider;
    private obj : {[key: string] : string};

    constructor(key : string, rootStorageProvider : IStorageProvider)
    {
        this.subKey = key;
        this.rootProvider = rootStorageProvider;
        
        // Load the object from store.
        const fromStore = rootStorageProvider.getItem(this.subKey);
        if (fromStore === null)
        {
            this.obj = {};
        }
        else
        {
            this.obj = JSON.parse(fromStore);
        }
    }

    public setItem(key: string, item: string) : void
    {
        this.obj[key] = item;
        this.rootProvider.setItem(this.subKey, JSON.stringify(this.obj));
    }

    public getItem(key: string) : string | null
    {
        if (key in this.obj)
        {
            return this.obj[key];
        }
        else
        {
            return null;
        }
    }

    public clear() : void
    {
        this.obj = {};
        this.rootProvider.setItem(this.subKey, JSON.stringify(this.obj));
    }
}