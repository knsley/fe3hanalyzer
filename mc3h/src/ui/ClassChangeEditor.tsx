/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import { CharacterClass, getClassDisplayName } from '../data/CharacterClass';
import { CharacterName, getCharacterDisplayName } from '../data/CharacterName';
import { hasClassGeneralData, getEligibleClasses, getRequirementForCharacterAndClass } from '../data/ClassData';
import { ClassAndLevelSelector } from './ClassAndLevelSelector';
import { ClassChangeList } from './ClassChangeList';

interface ClassAddWidgetProps
{
    // Need this to restrict available classes.
    character : CharacterName;
    selectedClass : CharacterClass;
    selectedLevel : number;
    minLevel : number;

    onSelectionChanged : (characterClass : CharacterClass, level : number) => void;
    onAddButtonClicked : (characterClass : CharacterClass, level : number) => void;
}

const ClassAddWidgetContainerStyle : React.CSSProperties = {
    marginTop: 8,
    marginLeft: 16,
    display: "flex",
    flexDirection: "row",
    flexBasis: 0,
    flexWrap: "nowrap",
};

const ClassAndLevelSelectorStyle : React.CSSProperties = {
    marginRight: 8,
    display : "flex",
    flexGrow : 0,
    flexShrink : 0,
    alignSelf: "flex-end"
};

const AddButtonStyle : React.CSSProperties = {
    display : "flex",
    flexGrow : 0,
    flexShrink : 0,
    alignSelf: "flex-end"

}

function ClassAddWidget(props : ClassAddWidgetProps) : JSX.Element
{
    const availableClasses = getEligibleClasses(props.character);

    if (!availableClasses.has(props.selectedClass))
    {
        throw new RangeError(`Character ${getCharacterDisplayName(props.character)} isn't eligible for selected class ${getClassDisplayName(props.selectedClass)}`);
    }

    const classRequirement = getRequirementForCharacterAndClass(props.character, props.selectedClass);

    if (classRequirement === undefined)
    {
        throw new RangeError("Got undefined class requirements for a known eligible class.");
    }

    if (classRequirement.level > props.selectedLevel)
    {
        throw new RangeError(`Selected level ${props.selectedLevel} is below minimum level for class, ${classRequirement.level}`);
    }

    const selectionChangedHandler = (characterClass : CharacterClass, level : number) => {
        props.onSelectionChanged(characterClass, level);
    };

    const addClickedHandler = (event : React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        props.onAddButtonClicked(props.selectedClass, props.selectedLevel);
    };

    return <div style={ClassAddWidgetContainerStyle}>
        <ClassAndLevelSelector 
            selectedClass={props.selectedClass} 
            selectedLevel={props.selectedLevel}
            character={props.character}
            minLevel={props.minLevel}
            containerStyle={ClassAndLevelSelectorStyle}
            onChanged={selectionChangedHandler} />
        <div style={AddButtonStyle}>
            <Button id="class-change-add-button" variant="outlined" color="primary" onClick={addClickedHandler}>
                Add
            </Button>
        </div>
    </div>;
}

export interface ClassChangeEditorProps
{
    character : CharacterName;
    classChangeList : Map<number, Array<CharacterClass>>;
    minLevel : number;

    onClassChangeListChange : (changes : Map<number, Array<CharacterClass>>) => void;
}

interface ClassChangeEditorState
{
    addWidgetClass : CharacterClass;
    addWidgetLevel : number;
}

function getClassChangeEditorDefaultState(character : CharacterName) : ClassChangeEditorState
{
    const eligibleClasses = Array.from(getEligibleClasses(character))
        .filter((c) => hasClassGeneralData(c))
        .sort((a,b) => a - b);
    
    if (eligibleClasses.length === 0)
    {
        throw new Error(`No viable classes for selected character ${character}`);
    }

    const defaultClassChoice = eligibleClasses[0];
    const defaultClassRequirement = getRequirementForCharacterAndClass(character, defaultClassChoice);

    if (defaultClassRequirement === undefined)
    {
        throw new RangeError("Got undefined class requirements for a known eligible class.");
    }
    
    return {
        addWidgetClass : defaultClassChoice,
        addWidgetLevel : defaultClassRequirement.level
    };
}

const ClassChangeEditorContainerStyle : React.CSSProperties = {
};

export function ClassChangeEditor(props : ClassChangeEditorProps) : JSX.Element
{
    // Need state to store the class and level selector's state.
    const [state, setState] = useState(getClassChangeEditorDefaultState(props.character));
    
    let immediateStateUpdateNeeded = false;

    const eligibleClasses = getEligibleClasses(props.character);
    let effectiveClass = state.addWidgetClass;
    if (!eligibleClasses.has(effectiveClass))
    {
        const asArray = Array.from(eligibleClasses);

        if (asArray.length === 0)
        {
            throw new Error("No eligible classes are selectable for the given character. This is usually an incomplete data error.");
        }

        asArray.sort((a, b) => a - b);
        effectiveClass = asArray[0];
        immediateStateUpdateNeeded = true;
    }

    let effectiveLevel = state.addWidgetLevel;
    const classRequirement = getRequirementForCharacterAndClass(props.character, effectiveClass);

    if (classRequirement === undefined)
    {
        throw new RangeError("Got undefined class requirements for a known eligible class.");
    }

    const requiredLevelForEffectiveClass = classRequirement.level;
    if (effectiveLevel < requiredLevelForEffectiveClass || effectiveLevel < props.minLevel)
    {
        effectiveLevel = Math.max(requiredLevelForEffectiveClass, props.minLevel);
        immediateStateUpdateNeeded = true;
    }

    if (immediateStateUpdateNeeded)
    {
        setState({
            addWidgetClass : effectiveClass,
            addWidgetLevel : effectiveLevel
        });
    }

    const addWidgetChangeHandler = async (c : CharacterClass, l : number) => {
        setState({
            addWidgetClass : c,
            addWidgetLevel : l
        });
    };
    const addWidgetConfirmHandler = async (c : CharacterClass, l : number) => {
        const appendedMap = new Map<number, Array<CharacterClass>>(props.classChangeList.entries());
        
        if (appendedMap.has(l))
        {
            appendedMap.get(l)?.push(c);
        }
        else
        {
            appendedMap.set(l, [c]);
        }

        props.onClassChangeListChange(appendedMap);
    };

    const classChangeListReorderedHandler = async (classChangeList : Map<number, Array<CharacterClass>>) => {
        props.onClassChangeListChange(classChangeList);
    };

    return <div style={ClassChangeEditorContainerStyle}>
        <ClassChangeList
            list={props.classChangeList}
            minLevel={props.minLevel}
            onReordered={classChangeListReorderedHandler}
        />
        <ClassAddWidget
            character={props.character}
            minLevel={props.minLevel}
            selectedClass={effectiveClass}
            selectedLevel={effectiveLevel}
            onSelectionChanged={addWidgetChangeHandler}
            onAddButtonClicked={addWidgetConfirmHandler}
        />
    </div>;
}