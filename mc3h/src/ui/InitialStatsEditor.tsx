/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from 'react';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

import { CharacterClass } from '../data/CharacterClass';
import { getCharacterMaxBaseStats, getCharactersWithDefinedData, StatLimitMods } from '../data/CharacterData';
import { CharacterName } from '../data/CharacterName';
import { getClassGeneralData, hasClassGeneralData, getEligibleClasses, getRequirementForCharacterAndClass } from '../data/ClassData';
import { addStats, forEachStatV, StatArray, statsMax, statsMin, zeroStats } from '../sim/StatArray';
import { CharacterSelector } from './CharacterSelector';
import { ClassAndLevelSelector } from './ClassAndLevelSelector';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Button from '@material-ui/core/Button';
import { InitialStatPresetDialog } from './InitialStatPresetDialog';
import { InitialStats } from '../data/CharacterPresetLoader';
import Tooltip from '@material-ui/core/Tooltip';

export interface StatArraySelectorProps
{
    value : StatArray;
    minimums : StatArray;
    maximums : StatArray;
    onChanged : (stat : StatArray) => void;
    containerStyle? : React.CSSProperties;
    elementStyle? : React.CSSProperties;
}

/*
export const iHP =  0;
export const iSTR = 1;
export const iMAG = 2;
export const iDEX = 3;
export const iSPD = 4;
export const iLCK = 5;
export const iDEF = 6;
export const iRES = 7;
export const iCHA = 8;
*/
const STAT_NAME_LIST = ["Hp", "Str", "Mag", "Dex", "Spd", "Lck", "Def", "Res", "Cha"];

export function StatArraySelector(props : StatArraySelectorProps) : JSX.Element
{
    const elements : Array<JSX.Element> = [];

    const style : React.CSSProperties = {...props.containerStyle};

    function inputChanged(index : number, value : number)
    {
        const newStats : StatArray = [...props.value];
        newStats[index] = value;
        props.onChanged(newStats);
    }
    
    forEachStatV(props.value, (stat : number, index : number) => {
        const savedIndex = index;
        const id = `${STAT_NAME_LIST[index]}-input`;
        elements.push(
            <div style={props.elementStyle} key={index}>
                <FormControl>
                    <InputLabel htmlFor={id}>{STAT_NAME_LIST[index]}</InputLabel>
                    <Input id={id} type="number" value={stat} 
                        inputProps={{ min: props.minimums[index], max: props.maximums[index]}} 
                        onChange={(event) => {inputChanged(savedIndex, parseInt(event.target.value))}}/>
                </FormControl>
            </div>
        );
    });

    return <div style={style}>
        {elements}
    </div>;
}

export interface InitialStatsEditorProps extends InitialStats
{
    maxStatMods? : StatLimitMods;
    handler : (value : InitialStats) => void;
}

function reconcile(character : CharacterName, characterClass : CharacterClass, 
    level : number, stats : StatArray, statMaxMods? : StatLimitMods)
{
    let reconciled : InitialStats = {
        character : character,
        class : characterClass,
        level : level,
        stats : stats
    };

    // Step 1: enforce that the class chosen is valid for the character, else default to first valid class.
    const validClasses = getEligibleClasses(reconciled.character);
    if (!validClasses.has(reconciled.class))
    {
        if (validClasses.size === 0)
        {
            throw new Error("Character has no valid classes. This is a data error.");
        }

        // Grab first one
        for (const c of validClasses)
        {
            reconciled.class = c;
            break;
        }
    }

    // Step 2: if class level min is low, bump the level.
    const specificRequirement = getRequirementForCharacterAndClass(character, reconciled.class);
    // Should always be defined because of the eligible classes check earlier.
    if (specificRequirement === undefined)
    {
        throw new RangeError("Used ineligible class in initial stats reconciliation.");
    }
    const minLevel = specificRequirement.level;

    if (reconciled.level < minLevel)
    {
        reconciled.level = minLevel;
    }

    // Step 3: If stats are below class baselines, clamp stats up. 
    // If stats are above character maximum, clamp stats down.
    const classBaseStats = getClassGeneralData(reconciled.class).baseStats;
    const characterMaxStats = getCharacterMaxBaseStats(character, statMaxMods);
    reconciled.stats = statsMax(classBaseStats, reconciled.stats);
    reconciled.stats = statsMin(characterMaxStats, reconciled.stats);

    return reconciled;
}

const OUTER_LAYOUT : React.CSSProperties = {
    display : "flex",
    flexDirection : "row",
    flexBasis : 0,
    flexWrap : "nowrap",
    alignItems : "stretch",
    padding: 8,
}

// const THUMBNAIL_LAYOUT : React.CSSProperties = {
//     display : "block",
//     flexGrow : 0,
//     flexShrink : 0
// }

const FORM_CONTAINER_LAYOUT : React.CSSProperties = {
    display : "flex",
    flexDirection : "column",
    flexBasis : "auto",
    flexWrap : "nowrap",
    flexGrow : 1,
    flexShrink : 1,
    marginLeft: 8,
};

const INNER_ROW_STYLE : React.CSSProperties = {
    display : "flex",
    flexGrow : 0,
    flexShrink : 0,
    flexDirection: "column",
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: 'stretch'
};

const CHARACTER_IDENTITY_LAYOUT : React.CSSProperties = {
    display : "flex",
    flexDirection : "row",
    flexBasis : 0,
    flexGrow: 1,
    flexShrink: 0,
    width: '100%'
};

const CHARACTER_SELECTOR_STYLE : React.CSSProperties = {
    display : "block",
    flexGrow : 0,
    flexShrink : 0,
};

const CLASS_AND_LEVEL_SELECTOR_STYLE : React.CSSProperties = {
    display : "block",
    flexGrow : 0,
    flexShrink : 0,
};

const PRESET_BUTTON_STYLE : React.CSSProperties = {
    display : "flex",
    flexGrow : 1,
    flexShrink : 0,
    flexDirection: 'row',
    justifyContent: 'flex-end'
};

const STAT_ARRAY_SELECTOR_STYLE : React.CSSProperties = {
    display : "flex",
    flexGrow: 0,
    flexShrink: 0,
    flexDirection : "row",
    flexBasis : 0,
    flexWrap : "wrap",
    justifyContent: "flex-start",
};

const STAT_ARRAY_ELEMENT_STYLE : React.CSSProperties = {
    display : "flex",
    flexGrow : 0,
    flexShrink : 0,
};

export function InitialStatsEditor(props : InitialStatsEditorProps) : JSX.Element
{
    // Index 0 as default
    const [presetDialogOpen, setPresetDialogOpen] = React.useState<boolean>(false);
    //const [presetCharacter, setPresetCharacter] = React.useState<CharacterName>(props.character);

    const showPresetDialog = () => {
        setPresetDialogOpen(true);
    };

    let minLevel = 1;
    let statMinumums = zeroStats();
    let bonusStats = zeroStats();
    if (hasClassGeneralData(props.class))
    {
        const classData = getClassGeneralData(props.class);
        bonusStats = classData.bonusStats;
        statMinumums = addStats(classData.baseStats, classData.bonusStats);
    }

    const specificRequirement = getRequirementForCharacterAndClass(props.character, props.class);
    if (specificRequirement !== undefined)
    {
        minLevel = specificRequirement.level;
    }

    const characterMaxStats = addStats(getCharacterMaxBaseStats(props.character, props.maxStatMods), bonusStats);

    const _character_handler = (character : CharacterName) =>
    {
        //setPresetCharacter(character);
        props.handler(reconcile(character, props.class, props.level, props.stats, props.maxStatMods));
    }

    const _class_and_level_handler = (c : CharacterClass, l : number) =>
    {
        props.handler(reconcile(props.character, c, l, props.stats, props.maxStatMods));
    }

    const _stat_handler = (stats : StatArray) =>
    {
        // Undo effect of class bonus stats
        props.handler(reconcile(props.character, props.class, props.level, stats, props.maxStatMods));
    }

    const _on_preset_dialog_cancelled = () => {
        setPresetDialogOpen(false);
    }

    const on_preset_stats_selected = (statBundle : InitialStats) =>
    {
        setPresetDialogOpen(false);
        props.handler(reconcile(statBundle.character, statBundle.class, statBundle.level, statBundle.stats, props.maxStatMods));
    }

    const dialog = <InitialStatPresetDialog 
                        open={presetDialogOpen} 
                        defaultCharacter={props.character}
                        onCancelled={_on_preset_dialog_cancelled}
                        onSelected={on_preset_stats_selected}/>;

    //<CharacterThumbnail character={props.character} width={THUMBNAIL_WIDTH} height={THUMBNAIL_HEIGHT} style={THUMBNAIL_LAYOUT}/>
    return (
        <div style={OUTER_LAYOUT}>
            <div style={FORM_CONTAINER_LAYOUT}>
                <div style={INNER_ROW_STYLE}>
                    <FormLabel style={{textAlign: 'left', marginBottom: 8}}>Initial Stats</FormLabel>
                    <FormGroup style={{...CHARACTER_IDENTITY_LAYOUT, marginBottom: 8}}>
                        <CharacterSelector 
                            value={props.character} 
                            onSelected={_character_handler} 
                            containerStyle={CHARACTER_SELECTOR_STYLE} 
                            availableCharacters={getCharactersWithDefinedData()}/>
                        <ClassAndLevelSelector 
                            selectedClass={props.class} 
                            selectedLevel={props.level} 
                            character={props.character}
                            minLevel={minLevel}
                            maxLevel={99}
                            onChanged={_class_and_level_handler} 
                            containerStyle={CLASS_AND_LEVEL_SELECTOR_STYLE}/>
                        <div style={PRESET_BUTTON_STYLE}>
                            <FormControl>
                                <FormLabel>&nbsp;</FormLabel>
                                <Tooltip title="Look up and use well-known stats for the character, such as their level 1 stats, or stats when you recruit them at a specific chapter.">
                                    <Button variant="outlined" color="primary" onClick={() => showPresetDialog()} 
                                        style={{marginTop: -4, flexGrow: 0, flexShrink: 0}}>
                                        Look Up Stats
                                    </Button>
                                </Tooltip>
                            </FormControl>
                        </div>
                    </FormGroup>
                </div>
                {dialog}
                <div style={INNER_ROW_STYLE}>
                    <StatArraySelector
                        value={props.stats} 
                        minimums={statMinumums} 
                        maximums={characterMaxStats} 
                        onChanged={_stat_handler} 
                        containerStyle={STAT_ARRAY_SELECTOR_STYLE}
                        elementStyle={STAT_ARRAY_ELEMENT_STYLE}/>
                </div>
            </div>
        </div>
    );
}