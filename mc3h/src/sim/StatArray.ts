/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { clamp } from "../model/Util";

// Indexes for semantically meaningful reference
export const iHP =  0;
export const iSTR = 1;
export const iMAG = 2;
export const iDEX = 3;
export const iSPD = 4;
export const iLCK = 5;
export const iDEF = 6;
export const iRES = 7;
export const iCHA = 8;
// Use invalid index to avoid indexing past array end.
export const iTOTAL = -1;

const CanonicalStatNamesByIndex : Map<number,string> = new Map<number,string>();
CanonicalStatNamesByIndex.set(iHP, "hp");
CanonicalStatNamesByIndex.set(iSTR, "str");
CanonicalStatNamesByIndex.set(iMAG, "mag");
CanonicalStatNamesByIndex.set(iDEX, "dex");
CanonicalStatNamesByIndex.set(iSPD, "spd");
CanonicalStatNamesByIndex.set(iLCK, "lck");
CanonicalStatNamesByIndex.set(iDEF, "def");
CanonicalStatNamesByIndex.set(iRES, "res");
CanonicalStatNamesByIndex.set(iCHA, "cha");
CanonicalStatNamesByIndex.set(iTOTAL, "stat+1");

const CanonicalStatIndicesByName : Map<string,number> = new Map<string,number>();
Array.from(CanonicalStatNamesByIndex.entries()).forEach(entry => CanonicalStatIndicesByName.set(entry[1], entry[0]));

export function getCanonicalStatNameByIndex(statIndex : number) : string
{
    const r = CanonicalStatNamesByIndex.get(statIndex);
    if (r === undefined)
    {
        throw new RangeError(`Unknown StatArray index ${statIndex}`);
    }
    else
    {
        return r;
    }
}

export function getCanonicalStatIndexByName(statName : string) : number
{
    const r = CanonicalStatIndicesByName.get(statName);
    if (r === undefined)
    {
        throw new RangeError(`Unknown canonical stat name ${statName}`);
    }
    else
    {
        return r;
    }
}

// Should all be integers.
export type StatArray = [
    hp: number,
    str: number,
    mag: number,
    dex: number,
    spd: number,
    lck: number,
    def: number,
    res: number,
    cha: number,
];

// Should all be range [0,1] for probabilities of stat up at level up.
export type StatUpProbabilities = [
    hp: number,
    str: number,
    mag: number,
    dex: number,
    spd: number,
    lck: number,
    def: number,
    res: number,
    cha: number,
];

export const STAT_COUNT = 9;
export function forEachStat<T extends StatArray | StatUpProbabilities>(stat : T, callback : (stat : number, index : number) => number) : T
{
    let outputs = new Array<number>(9);

    const statCount = STAT_COUNT;
    for (let i = 0; i < statCount; i++)
    {
        outputs[i] = callback(stat[i], i);
    }

    return outputs as T;
}

export function forEachStatV<T extends StatArray | StatUpProbabilities>(stat : T, callback : (stat : number, index : number) => void) : void
{
    const statCount = STAT_COUNT;
    for (let i = 0; i < statCount; i++)
    {
        callback(stat[i], i);
    }
}

export function forEachStatIndex<T>(callback : (index : number) => T) : T[]
{
    const statCount = STAT_COUNT;
    const output = new Array<T>(0);

    for (let i = 0; i < statCount; i++)
    {
        output.push(callback(i));
    }

    return output;
}

export function forAllStatIndices(callback : (index : number) => boolean) : boolean
{
    const statCount = STAT_COUNT;

    for (let i = 0; i < statCount; i++)
    {
        if (!callback(i))
        {
            return false;
        }
    }

    return true;
}

export function mapStatArray<T extends StatArray | StatUpProbabilities, U>(stat : T, callback : (stat : number, index : number) => U) : U[]
{
    let outputs = new Array<U>(9);

    const statCount = STAT_COUNT;
    for (let i = 0; i < statCount; i++)
    {
        outputs[i] = callback(stat[i], i);
    }

    return outputs;
}

// Integers
export type StartingStats = StatArray;

// Should be 0 or 1
export type LevelUpGrowth = StatArray;

// Integers
export type ClassBaseStats = StatArray;

// Integers
export type ClassBonusStats = StatArray;

// Helper
export function statTotal(stats : StatArray)
{
    return stats.reduce((p, c) => p + c);
}

export function initStats(n : number) : StatArray
{
    return [n,n,n,n,n,n,n,n,n];
}

export function zeroStats() : StatArray
{
    return initStats(0);
}

type _StatApplyOp = (a : number, b : number) => number;
const _StatIndexes = [0,1,2,3,4,5,6,7,8]

// "extends StatArray" elides the fact that both StatArray and StatUpProbabilities are tuples of 9 numbers.
function _statApply<T extends StatArray>(s1 : T, s2 : T, op : _StatApplyOp) : T
{
    const vectorOut = _StatIndexes.map(i => op(s1[i], s2[i]));
    return [...vectorOut] as T;
}

export function addStats(s1 : StatArray, s2 : StatArray)
{
    return _statApply(s1, s2, (a, b) => a + b);
}

export function addProbabilities(s1 : StatUpProbabilities, s2 : StatUpProbabilities)
{
    return _statApply(s1, s2, (a, b) => clamp(a + b, 0.0, 1.0));
}

export function subtractStats(s1 : StatArray, s2 : StatArray)
{
    return _statApply(s1, s2, (a, b) => a - b);
}

export function areEqualStats(s1 : StatArray, s2 : StatArray)
{
    return s1.every((n, i) => n === s2[i]);
}

export function statsMin(s1 : StatArray, s2 : StatArray)
{
    return _statApply(s1, s2, (a, b) => Math.min(a, b));
}

export function statsMax(s1 : StatArray, s2 : StatArray)
{
    return _statApply(s1, s2, (a, b) => Math.max(a, b));
}

export function statToString(s : StatArray)
{
    const segments : string[] = forEachStatIndex(i => `${getCanonicalStatNameByIndex(i)}: ${s[i]}`);
    return `{${segments.join(", ")}}`;
}

export class StatAccumulator
{
    public hp: number;
    public str: number;
    public mag: number;
    public dex: number;
    public spd: number;
    public lck: number;
    public def: number;
    public res: number;
    public cha: number;

    private statMod: StatArray;
    private statModTotal : number;

    public constructor(start : StatArray | undefined = undefined)
    {
        if (start === undefined)
        {
            this.hp = 0;
            this.str = 0;
            this.mag = 0;
            this.dex = 0;
            this.spd = 0;
            this.lck = 0;
            this.def = 0;
            this.res = 0;
            this.cha = 0;
        }
        else
        {
            [this.hp, this.str, this.mag, this.dex, this.spd, this.lck, this.def, this.res, this.cha] = start;
        }

        this.statMod = zeroStats();
        this.statModTotal = 0;
    }

    public set bonusStats(bonusStats : StatArray)
    {
        this.statMod = bonusStats;
        this.statModTotal = statTotal(this.statMod);
    }

    public get statArray() : StatArray
    {
        return addStats(this.statMod, [this.hp, this.str, this.mag, this.dex, this.spd, this.lck, this.def, this.res, this.cha]);
    }

    public get total() : number
    {
        return this.hp + this.str + this.mag + this.dex + this.spd + this.lck + this.def + this.res + this.cha + this.statModTotal;
    }

    public add(stats : StatArray)
    {
        this.hp += stats[iHP];
        this.str += stats[iSTR];
        this.mag += stats[iMAG];
        this.dex += stats[iDEX];
        this.spd += stats[iSPD];
        this.lck += stats[iLCK];
        this.def += stats[iDEF];
        this.res += stats[iRES];
        this.cha += stats[iCHA];
    }

    public rebase(stats : StatArray)
    {
        this.hp = Math.max(this.hp, stats[iHP]);
        this.str = Math.max(this.str, stats[iSTR]);
        this.mag = Math.max(this.mag, stats[iMAG]);
        this.dex = Math.max(this.dex, stats[iDEX]);
        this.spd = Math.max(this.spd, stats[iSPD]);
        this.lck = Math.max(this.lck, stats[iLCK]);
        this.def = Math.max(this.def, stats[iDEF]);
        this.res = Math.max(this.res, stats[iRES]);
        this.cha = Math.max(this.cha, stats[iCHA]);
    }
}
