/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import FormLabel from "@material-ui/core/FormLabel";
import { CharacterClass } from "../data/CharacterClass";
import { ClassChangeSingleLevel } from "./ClassChangeSingleLevel";
import Chip from "@material-ui/core/Chip";

export interface ClassChangeListProps
{
    list : Map<number, Array<CharacterClass>>;
    minLevel : number;
    onReordered : (newList : Map<number, Array<CharacterClass>>) => void;
}

const CONTAINER_STYLE : React.CSSProperties = {
    display : "flex",
    flexDirection : "row",
    flexBasis : 0,
    justifyContent: "flex-start",
    alignItems : "flex-start",
    flexWrap : "wrap",
    paddingLeft: 8,
    paddingRight: 8,
};

const ROW_STYLE : React.CSSProperties = {
    display : "flex",
    flexDirection : "row",
    flexBasis : 0,
    alignItems : "center",
};

const ROW_ELEMENT_STYLE : React.CSSProperties = {
    flexShrink : 0,
    flexGrow : 0,
    minWidth : 24,
    padding : 4,
    textAlign : "right",
    alignContent : "baseline",
};

export function ClassChangeList(props : ClassChangeListProps) : JSX.Element
{
    const elements : Array<JSX.Element> = [];

    // Need sorting because keys are in insertion order.
    const levelsInOrder = Array.from(props.list.keys());
    levelsInOrder.sort((a, b) => a - b);
    
    const reorderedHandler = (l : number, c : Array<CharacterClass>) => {
        const newList = new Map<number, Array<CharacterClass>>(props.list.entries());
        newList.set(l, c);
        props.onReordered(newList);
    };

    const deletedHandler = (l : number, c : Array<CharacterClass>) => {
        const newList = new Map<number, Array<CharacterClass>>(props.list.entries());
        if (c.length > 0)
        {
            newList.set(l, c);
        }
        else
        {
            newList.delete(l);
        }

        props.onReordered(newList);
    };

    for (const level of levelsInOrder)
    {
        const fixedLevel = level;
        // Since we're iterating keys we know the Map.get will not return undefined.
        elements.push(
        <div style={ROW_STYLE} key={fixedLevel}>
            <FormLabel style={ROW_ELEMENT_STYLE}>{fixedLevel.toString()}</FormLabel>
            <ClassChangeSingleLevel
                classes={props.list.get(level) as Array<CharacterClass>}
                onReordered={(newClassList) => reorderedHandler(fixedLevel, newClassList)}
                onDeleted={(newClassList) => deletedHandler(fixedLevel, newClassList)}
                disabled={fixedLevel < props.minLevel}
            />
        </div>);
    }

    if (elements.length > 0)
    {
        return <div style={CONTAINER_STYLE}>
            {elements}
        </div>;
    }
    else
    {
        return <div style={CONTAINER_STYLE}><Chip style={{textAlign: "left", margin: 8, userSelect: "none"}} label="No class changes" disabled /></div>;
    }
}