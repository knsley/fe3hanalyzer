/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { CharacterClass, getCharacterClassesByCategory, CharacterClassGroup, getCharacterClassGroupDisplayName, getClassDisplayName } from "../data/CharacterClass";
import { CharacterName } from "../data/CharacterName";
import { getEligibleClasses } from "../data/ClassData";

export interface ClassSelectorProps
{
    value : CharacterClass;

    character : CharacterName;
    level? : number;

    onSelected : (character : CharacterClass) => void;
    props? : {[key : string] : any};
}

const CharacterNameList = new Map<CharacterClass, string>();
(() => 
{
    for (let i = 0; i < CharacterClass.End.valueOf(); i++)
    {
        const character = i as CharacterClass;
        CharacterNameList.set(character, getClassDisplayName(character));
    }
})();

type SelectChangedEvent = React.ChangeEvent<{name?: string, value: unknown}>;

export function ClassSelector(props : ClassSelectorProps) : JSX.Element
{
    const characterEntries = new Array<JSX.Element>();
    const eligibleClasses = getEligibleClasses(props.character, props.level);

    if (!eligibleClasses.has(props.value))
    {
        characterEntries.push(<option disabled value={props.value.valueOf()} key={props.value.valueOf()}>{getClassDisplayName(props.value)}</option>);
    }

    for (let f = 0; f < CharacterClassGroup.End; f++)
    {
        const group = f as CharacterClassGroup;
        const entriesInGroup : Array<JSX.Element> = [];
        getCharacterClassesByCategory(group).forEach((c) => {
            if (eligibleClasses.has(c))
            {
                entriesInGroup.push(<option value={c.valueOf()} key={c.valueOf()}>{getClassDisplayName(c)}</option>);
            }
        })
        if (entriesInGroup.length > 0)
        {
            characterEntries.push(<optgroup label={getCharacterClassGroupDisplayName(group)} key={group}>{entriesInGroup}</optgroup>);
        }
    }

    const handler = async (event : SelectChangedEvent, child?: React.ReactNode) => {
        const selected = parseInt((event.target.value as any).toString());
        props?.onSelected(selected);
    };

    return (
    <>
        <FormControl>
            <InputLabel htmlFor="class-selector-field">Class</InputLabel>
            <Select {...props.props} native value={props.value} onChange={handler} id="class-selector-field" style={{minWidth: 160}}>
                {characterEntries}
            </Select>
        </FormControl>
    </>);
}