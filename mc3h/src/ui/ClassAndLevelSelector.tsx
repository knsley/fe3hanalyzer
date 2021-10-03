/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import { CharacterClass } from "../data/CharacterClass";
import { CHARACTER_MAX_LEVEL } from "../data/CharacterData";
import { CharacterName } from "../data/CharacterName";
import { getRequirementForCharacterAndClass, hasClassGeneralData } from "../data/ClassData";
import { ClassSelector } from "./ClassSelector";
import { LevelSelector } from "./LevelSelector";

export interface ClassAndLevelSelectorProps
{
    selectedClass : CharacterClass;
    selectedLevel : number;

    onChanged : (characterClass : CharacterClass, level : number) => void;

    character : CharacterName;
    minLevel? : number;
    maxLevel? : number;

    containerProps? : {[key : string] : any};
    containerStyle? : React.CSSProperties;

    classSelectorProps? : {[key : string] : any};
    levelSelectorProps? : {[key : string] : any};
}

export function ClassAndLevelSelector(props : ClassAndLevelSelectorProps) : JSX.Element
{
    const classRequirement = getRequirementForCharacterAndClass(props.character, props.selectedClass);

    const effectiveMinLevel = Math.max(props.minLevel ?? 1, classRequirement?.level ?? 1);    
    const effectiveMaxLevel = props.maxLevel ?? CHARACTER_MAX_LEVEL;

    const classChangeHandler = (c : CharacterClass) => {
        if (hasClassGeneralData(c))
        {
            const newClassRequirement = getRequirementForCharacterAndClass(props.character, c)
            const effectiveNewMinLevel = newClassRequirement?.level ?? 1;
            if (effectiveNewMinLevel > props.selectedLevel)
            {
                // Maintain correctness constraint
                props.onChanged(c, effectiveNewMinLevel);    
            }
            else
            {
                props.onChanged(c, props.selectedLevel);    
            }
        }
        else
        {
            props.onChanged(c, props.selectedLevel);
        }
    };

    const levelChangeHandler = (l : number) => {
        if (l < effectiveMinLevel)
        {
            props.onChanged(props.selectedClass, effectiveMinLevel);
        }
        else if (l > effectiveMaxLevel)
        {
            props.onChanged(props.selectedClass, effectiveMaxLevel);
        }
        else
        {
            props.onChanged(props.selectedClass, l);
        }
    };

    let containerStyle : React.CSSProperties = {
        ...props.containerStyle
    };

    return (
        <div {...props.containerProps} style={containerStyle}>
            <ClassSelector 
                value={props.selectedClass} 
                character={props.character}
                onSelected={classChangeHandler}
                props={props.classSelectorProps}
            />
            <LevelSelector
                minLevel={effectiveMinLevel}
                maxLevel={props.maxLevel}
                value={props.selectedLevel}
                onSelected={levelChangeHandler}
                props={props.levelSelectorProps}
                customText="Level"
                labelStyle="overhead"
            />
        </div>);
    
}