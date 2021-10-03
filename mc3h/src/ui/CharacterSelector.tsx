/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from '@material-ui/core/Select';
import { CharacterFaction, CharacterName, getCharactersByFaction, getFactionDisplayName, getCharacterDisplayName } from "../data/CharacterName";

export interface CharacterSelectorProps
{
    value : CharacterName;
    onSelected : (character : CharacterName) => void;
    availableCharacters? : Set<CharacterName>;
    containerStyle? : React.CSSProperties;
}

const CharacterNameList = new Map<CharacterName, string>();
(() => 
{
    for (let i = 0; i < CharacterName.End.valueOf(); i++)
    {
        const character = i as CharacterName;
        CharacterNameList.set(character, getCharacterDisplayName(character));
    }
})();

type SelectChangedEvent = React.ChangeEvent<{name?: string, value: unknown}>;

export function CharacterSelector(props : CharacterSelectorProps) : JSX.Element
{
    const characterEntries = new Array<JSX.Element>();
    for (let f = 0; f < CharacterFaction.End; f++)
    {
        const faction = f as CharacterFaction;
        const entriesInFaction : Array<JSX.Element> = [];
        getCharactersByFaction(faction).forEach((character) => {
            if (props.availableCharacters === undefined || props.availableCharacters.has(character))
            {
                entriesInFaction.push(<option value={character.valueOf()} key={character.valueOf()}>{getCharacterDisplayName(character)}</option>);
            }
        })
        if (entriesInFaction.length > 0)
        {
            characterEntries.push(<optgroup label={getFactionDisplayName(faction)} key={faction}>{entriesInFaction}</optgroup>);
        }
    }

    const handler = async (event : SelectChangedEvent, child?: React.ReactNode) => {
        const selected = parseInt((event.target.value as any).toString());
        props?.onSelected(selected);
    };

    return (
    <div style={props.containerStyle}>
        <FormControl>
            <InputLabel htmlFor="character-selector-field">Character</InputLabel>
            <Select native value={props.value} onChange={handler}>
                {characterEntries}
            </Select>
        </FormControl>
    </div>);
}