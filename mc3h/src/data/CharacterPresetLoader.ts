/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { StatArray } from "../sim/StatArray";
import { CharacterClass, getClassDisplayName } from "./CharacterClass";
import { getCharacterInitialPresets } from "./CharacterData";
import { CharacterName } from "./CharacterName";
import { CharacterInitialData } from "./CharacterPresets";


export interface InitialStats
{
    character : CharacterName;
    class : CharacterClass;
    level : number;
    // Presumes stats are with class bonuses taken into account.
    // e.g. you should be able to copy off the character sheet in game
    // and it should interpret correctly.
    stats : StatArray;
}

export interface Preset
{
    index : number;
    displayName : string;
    stats : InitialStats;
}

export interface PresetsBundle
{
    getCharacterList : () => Set<CharacterName>;
    getPresetsForCharacter : (character : CharacterName) => Array<Preset>;
};

function getPresetDisplayName(characterName : CharacterName, initialData : CharacterInitialData) : string
{
    if (initialData.title !== undefined)
    {
        return `${initialData.title} (lvl ${initialData.level} ${getClassDisplayName(initialData.class)})`;
    }
    else
    {
        return `lvl ${initialData.level} ${getClassDisplayName(initialData.class)}`;
    }
}

function computePresets() : Map<CharacterName, Preset[]>
{
    const presetMap = new Map<CharacterName, Array<Preset>>();

    for (let i = 0; i < CharacterName.End; i++)
    {
        const characterName = i as CharacterName;

        const presets : Preset[] = getCharacterInitialPresets(characterName).map((initialData, index) => {
            return {
                index,
                displayName: getPresetDisplayName(characterName, initialData),
                stats: {
                    character: characterName,
                    class: initialData.class,
                    level: initialData.level,
                    stats : initialData.stats
                }
            };
        });

        if (presets.length > 0)
        {
            presetMap.set(characterName, presets);
        }
    }

    return presetMap;
}

class PresetsBundleImpl implements PresetsBundle
{
    private presetLookup : Map<CharacterName, Array<Preset>>;

    constructor()
    {
        this.presetLookup = computePresets();
    }

    public getCharacterList() : Set<CharacterName>
    {
        return new Set(this.presetLookup.keys());
    }

    public getPresetsForCharacter(character : CharacterName) : Array<Preset>
    {
        const result = this.presetLookup.get(character);
        
        if (result === undefined)
        {
            return [];
        }
        else
        {
            return result;
        }
    }
}

let bundleInstance : PresetsBundleImpl | undefined;

function initializePresetsBundleImpl()
{
    bundleInstance = new PresetsBundleImpl();
}

export function loadInitialStatsPresets() : PresetsBundle
{
    if (bundleInstance === undefined)
    {
        initializePresetsBundleImpl();
    }

    return bundleInstance as PresetsBundle;
}