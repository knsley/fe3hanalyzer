/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass, getStartingClasses } from "../data/CharacterClass";
import { getCharacterInitialPresets, getDefaultStatModSetting } from "../data/CharacterData";
import { CharacterName } from "../data/CharacterName";
import { CharacterInitialData } from "../data/CharacterPresets";
import { ClassData, ClassRequirements, getClassGeneralData, getEligibleClasses, getRequirementForCharacterAndClass } from "../data/ClassData";
import { CharacterProfile } from "./CharacterProfile";

function getDefaultCharacterName() : CharacterName
{
    // We're just going to hardcode the default, but let's explicitly not default to a specific gender.
    if (Math.random() < 0.5)
    {
        return CharacterName.BylethMale;
    }
    else
    {
        return CharacterName.BylethFemale;
    }
}

export class NoValidDefaultClassError extends Error
{
    //constructor(message : string)
    //{
    //    super(message);
    //}
}

function getCharacterDefaultGenericClass(character : CharacterName, level : number) : CharacterClass
{
    const eligibleClasses = getEligibleClasses(character, level);
    
    if (eligibleClasses.size === 0)
    {
        throw new NoValidDefaultClassError(`Character has no eligible classes at level ${level}`);
    }

    const starterClasses = getStartingClasses();
    const baseClasses = Array.from(eligibleClasses).filter(c => starterClasses.has(c));
    if (baseClasses.length > 0)
    {
        // If there's a commoner or noble class then use that.
        return baseClasses[0];
    }
    else
    {
        // Otherwise use one of the classes with the lowest level requirement, which more or less means "Dancer".
        const classList = Array.from(eligibleClasses).map(c => [c, getClassGeneralData(c)] as [CharacterClass, ClassData]);
        classList.sort((a, b) => {
            // Can elide the "undefined" return value because we know the character is eligible, which
            // only happens if matching requirements exist.
            const aReq = getRequirementForCharacterAndClass(character, a[0]) as ClassRequirements;
            const bReq = getRequirementForCharacterAndClass(character, b[0]) as ClassRequirements;
            return aReq.level - bReq.level;
        });
        return classList[0][0];
    }
}

function getDefaultCharacterInitialData(character : CharacterName) : CharacterInitialData
{
    const presets = getCharacterInitialPresets(character);

    if (presets.length > 0)
    {
        // If there's existing initial data then use the lowest level one, and if there are multiple
        // then use whatever of the lowest level.
        const presetsCopy = [...presets];
        presetsCopy.sort((a, b) => a.level - b.level);
        return presetsCopy[0];
    }
    else
    {
        // If there isn't, then we make some shit up.
        return {
            level: 1,
            class: getCharacterDefaultGenericClass(character, 1),
            stats: [25, 5, 5, 5, 5, 5, 5, 5, 5]
        };
    }

}

// This is non-trivial because we are selecting "firsts" for every value but we must select valid values,
// and they must be internally consistent.
export function createDefaultEmptyCharacterProfile() : CharacterProfile
{
    const characterName = getDefaultCharacterName();
    const initialData = getDefaultCharacterInitialData(characterName);
    const endLevel = Math.max(30, initialData.level);
    const maxStatMods = getDefaultStatModSetting();

    return {
        character : characterName,
        startLevel : initialData.level,
        startClass : initialData.class,
        startStats : initialData.stats,
        changes : [],
        endLevel : endLevel,
        maxStatMods : maxStatMods
    };
}
