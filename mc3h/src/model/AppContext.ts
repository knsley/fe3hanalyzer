/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Essentially acts as the overall app state with accessor/mutator functions.

import React from "react";
import { IStorageProvider } from "../storage/NestedStorageProvider";
import { createAnalysisResultCache, IAnalysisResultCache } from "./AnalysisResultCache";
import { createPageManager, IPageManager } from "./PageManager";

export interface IAppContextValue
{
    // This should change with every change.
    modCounter : number;

    // These are persistent refs to singleton complex objects.
    pageManager : IPageManager;
    analysisCache : IAnalysisResultCache;
}

export interface IAppContext
{
    // Notifies of value changes.
    setValueChangedCallback(callback : (v : IAppContextValue) => void) : void;
    readonly currentValue : IAppContextValue;
    readonly Context : React.Context<IAppContextValue>;
}

// Page order is responsibility of owner to sort out and render. This is just data.
class AppContext implements IAppContext
{
    private modCount : number;
    private pageManager : IPageManager;
    private analysisResultCache : IAnalysisResultCache;
    private contextInstance : React.Context<IAppContextValue>;
    private _currentValue : IAppContextValue;

    private valueCallback : (v : IAppContextValue) => void;

    constructor(rootStorageProvider : IStorageProvider)
    {
        this.modCount = 0;
        this.pageManager = createPageManager(rootStorageProvider, () => this.pageListUpdated);
        this.analysisResultCache = createAnalysisResultCache(rootStorageProvider);
        this.contextInstance = React.createContext<IAppContextValue>(this.getDefaultContextValue());

        this._currentValue = {
            modCounter : this.modCount,
            pageManager : this.pageManager,
            analysisCache : this.analysisResultCache
        };

        this.valueCallback = v => {};
    }

    public setValueChangedCallback(callback : (v : IAppContextValue) => void) : void
    {
        this.valueCallback = callback;
    }

    public get Context() : React.Context<IAppContextValue>
    {
        return this.contextInstance;
    }

    public get currentValue() : IAppContextValue
    {
        return this._currentValue;
    }

    private updateValueAndNotify() : void
    {
        this.modCount++;

        this._currentValue = {
            ...this._currentValue,
            modCounter : this.modCount
        };

        this.valueCallback(this._currentValue);
    }

    private pageListUpdated() : void
    {
        this.updateValueAndNotify();
    }

    private getDefaultContextValue() : IAppContextValue
    {
        return {
            modCounter : this.modCount,
            pageManager : this.pageManager,
            analysisCache : this.analysisResultCache
        };
    }
}

let appContextInstance : IAppContext | null = null;
export function getAppContext()
{
    if (appContextInstance === null)
    {
        appContextInstance = new AppContext(window.sessionStorage);
    }
    return appContextInstance;
}
