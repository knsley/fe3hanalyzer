/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { StatDistributionsByLevel } from "../sim/GrowthResultAccumulator";
import { StatArray, zeroStats } from "../sim/StatArray";
import { IStorageProvider, NestedStorageProvider } from "../storage/NestedStorageProvider";
import { SERIES_COLOR_SCHEMES } from "../ui/ChartColorScheme";
import { CharacterProfile } from "./CharacterProfile";
import { createDefaultEmptyCharacterProfile } from "./Defaults";

export const INVALID_PAGE_LISTENER_HANDLE : number = -1;
const FIRST_PAGE_LISTENER_HANDLE : number = 0;

export interface AnalysisComponent
{
    profile : CharacterProfile;
    result : StatDistributionsByLevel;
}

export interface AnalysisReport
{
    // Cache profiles used for analysis so that report can be kept separately.
    components : AnalysisComponent[];
    cacheToken : number;
}

export interface PageData
{
    // Might need to swap this for a UI type that allows invalid UI selections
    profiles : CharacterProfile[];

    referenceStats : StatArray;

    report : AnalysisReport | null;
}

export class MaxCharacterProfileCountError extends Error
{
    public constructor(message : string)
    {
        super(message);
    }
}

export type PageCallback = (page : number, data : PageData) => void;

export interface IPageManager
{
    getPages() : Set<number>;
    hasPage(page : number) : boolean;
    createNewPage(page : number) : void;
    deletePage(page : number) : void;

    newProfile(page : number) : void;
    deleteProfile(page : number, index : number) : void;
    updateProfile(page : number, index : number, profile : CharacterProfile) : void;
    updateAnalysis(page : number, report : AnalysisReport | null) : void;
    // updateReferenceStats(page : number, stats : StatArray) : void;

    getPageData(page : number) : PageData;

    addPageListener(page : number, callback : PageCallback) : number;
    removePageListener(page : number, handle : number) : void;
}

function createNewPageData() : PageData
{
    return {
        profiles : [createDefaultEmptyCharacterProfile()],
        referenceStats : zeroStats(),
        report : null
    };
}

function getMaxProfileCount() : number
{
    return SERIES_COLOR_SCHEMES.length;
}

class PageManager implements IPageManager
{
    private storageProvider : IStorageProvider;
    private pages : Map<number, PageData>;
    private listeners : Map<number, Map<number, PageCallback>>;
    private listenerCounter : number;
    private pageListChangeCallback : () => void;

    public constructor(rootStorageProvider : IStorageProvider, pageListChangeCallback : () => void)
    {
        this.storageProvider = new NestedStorageProvider("pages", rootStorageProvider);
        this.pages = new Map<number, PageData>();
        this.listeners = new Map<number, Map<number, PageCallback>>();
        this.listenerCounter = FIRST_PAGE_LISTENER_HANDLE;
        this.pageListChangeCallback = pageListChangeCallback;
    }

    //
    // Page Management
    //

    public getPages() : Set<number>
    {
        return new Set(this.pages.keys());
    }

    public hasPage(page : number) : boolean
    {
        return this.pages.has(page);
    }

    public createNewPage(page : number)
    {
        if (this.pages.has(page))
        {
            throw new RangeError("Cannot create new page against an existing page number.")
        }

        this.pages.set(page, createNewPageData());
        this.pageListChangeCallback();
    }

    public deletePage(page : number)
    {
        if (this.pages.has(page))
        {
            this.pages.delete(page);
        }
        this.pageListChangeCallback();
    }

    public newProfile(page : number) : void
    {
        if (!this.pages.has(page))
        {
            throw new RangeError(`Cannot find page data for page number ${page}`);
        }

        // Can hide the undefined value because of the check above.
        const pageData = this.pages.get(page) as PageData;

        if (pageData.profiles.length >= getMaxProfileCount())
        {
            throw new MaxCharacterProfileCountError("Cannot add more profiles because profile limit has been reached.");
        }

        const newPageData : PageData = {
            profiles : [...pageData.profiles, createDefaultEmptyCharacterProfile()],
            referenceStats : zeroStats(),
            report : pageData.report
        };
        this.pages.set(page, newPageData);
        
        this.onPageUpdate(page);
    }

    public deleteProfile(page : number, index : number)
    {
        if (!this.pages.has(page))
        {
            throw new RangeError(`Cannot find page data for page number ${page}`);
        }

        // Can hide the undefined value because of the check above.
        const pageData = this.pages.get(page) as PageData;

        if (index >= pageData.profiles.length || index < 0)
        {
            throw new RangeError(`Profile index ${index} is outside range of profiles array.`);
        }

        const newProfileList = [...pageData.profiles];
        newProfileList.splice(index, 1);
        const newPageData : PageData = {
            profiles : newProfileList,
            referenceStats : pageData.referenceStats,
            report : pageData.report
        };
        this.pages.set(page, newPageData);
        
        this.onPageUpdate(page);
    }

    public updateProfile(page : number, index : number, profile : CharacterProfile) : void
    {
        if (!this.pages.has(page))
        {
            throw new RangeError(`Cannot find page data for page number ${page}`);
        }

        // Can hide the undefined value because of the check above.
        const pageData = this.pages.get(page) as PageData;

        if (index >= pageData.profiles.length || index < 0)
        {
            throw new RangeError(`Profile index ${index} is outside range of profiles array.`);
        }

        const newProfileList = [...pageData.profiles];
        newProfileList[index] = profile;
        const newPageData : PageData = {
            profiles : newProfileList,
            referenceStats : pageData.referenceStats,
            report : pageData.report
        };
        this.pages.set(page, newPageData);
        
        this.onPageUpdate(page);
    }

    public updateAnalysis(page : number, report : AnalysisReport | null) : void
    {
        if (!this.pages.has(page))
        {
            throw new RangeError(`Cannot find page data for page number ${page}`);
        }

        // Can hide the undefined value because of the check above.
        const pageData = this.pages.get(page) as PageData;
        const newPageData : PageData = {
            profiles : pageData.profiles,
            referenceStats : pageData.referenceStats,
            report : report
        };
        this.pages.set(page, newPageData);
        
        this.onPageUpdate(page);
    }

    // public updateReferenceStats(page : number, stats : StatArray) : void
    // {
    //     if (!this.pages.has(page))
    //     {
    //         throw new RangeError(`Cannot find page data for page number ${page}`);
    //     }

    //     const pageData = this.pages.get(page) as PageData;
    //     const newPageData : PageData = {
    //         profiles : pageData.profiles,
    //         referenceStats : stats,
    //         report : pageData.report
    //     };

    //     this.pages.set(page, newPageData);
        
    //     this.onPageUpdate(page);
    // }

    public getPageData(page : number) : PageData
    {
        if (!this.pages.has(page))
        {
            throw new RangeError(`Cannot find page data for page number ${page}`);
        }
        
        // Can hide the undefined value because of the check above.
        return this.pages.get(page) as PageData;
    }

    public addPageListener(page : number, callback : PageCallback) : number
    {
        if (!this.listeners.has(page))
        {
            this.listeners.set(page, new Map<number, PageCallback>());
        }

        // Safe to hide null because statement above guarantees the value.
        const pageListeners = this.listeners.get(page) as Map<number, PageCallback>;

        const newHandle = this.getNewPageListenerHandle();
        pageListeners.set(newHandle, callback);
        return newHandle;
    }

    public removePageListener(page : number, handle : number) : void
    {
        this.listeners.get(page)?.delete(handle);
    }

    private getNewPageListenerHandle() : number
    {
        const handleValue = this.listenerCounter;
        this.listenerCounter++;
        return handleValue;
    }

    private onPageUpdate(page : number) : void
    {
        if (this.listeners.has(page))
        {
            const listeners = this.listeners.get(page) as Map<number, PageCallback>;
            if (this.pages.has(page))
            {
                const pageData = this.pages.get(page) as PageData;
                for (const listener of listeners.values())
                {
                    listener(page, pageData);
                }
            }
        }
    }
}

export function createPageManager(rootStorageProvider : IStorageProvider,
    pageListChangeCallback : () => void) : IPageManager
{
    return new PageManager(rootStorageProvider, pageListChangeCallback);
}
