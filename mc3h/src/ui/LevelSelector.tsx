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
import FormControlLabel from "@material-ui/core/FormControlLabel";

export interface LevelSelectorProps
{
    minLevel? : number;
    maxLevel? : number;
    value : number;
    customText? : string;
    labelStyle? : "inline" | "overhead";
    onSelected : (level : number) => void;
    props? : {[key : string] : any};
}

type SelectChangedEvent = React.ChangeEvent<{name?: string, value: any}>;

export function LevelSelector(props : LevelSelectorProps) : JSX.Element
{
    const minLevel = props.minLevel ?? 1;
    const maxLevel = props.maxLevel ?? 99;

    function handler(event : SelectChangedEvent) {
        let selected = parseInt(event.target.value.toString());
        props?.onSelected(selected);
    };

    const entries : Array<JSX.Element> = [];
    for (let i = minLevel; i <= maxLevel; i++)
    {
        entries.push(
            <option value={i} key={i}>{i.toString()}</option>
        );
    }

    if (props.customText !== undefined)
    {
        if ((props.labelStyle ?? "overhead") === "overhead")
        {
            return (
                <FormControl>
                    <InputLabel htmlFor="level-selector-field">{props.customText}</InputLabel>
                    <Select {...props.props} native value={props.value} onChange={handler} id="level-selector-field">
                        {entries}
                    </Select>
                </FormControl>
            );
        }
        else
        {
            return (
                <FormControl>
                    <FormControlLabel 
                        control={
                            <Select {...props.props} native value={props.value} onChange={handler} id="level-selector-field" style={{marginLeft: 8}}>
                                {entries}
                            </Select>
                        }
                        label={props.customText}
                        labelPlacement="start"
                    />
                </FormControl>
            );
        }
    }
    else
    {
        return (
            <FormControl>
                <Select {...props.props} native value={props.value} onChange={handler} id="level-selector-field">
                    {entries}
                </Select>
            </FormControl>
        );
    }
}