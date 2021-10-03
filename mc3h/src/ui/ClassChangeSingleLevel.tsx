/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import Chip from "@material-ui/core/Chip";
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';

import { DragDropContext, Droppable, Draggable, DroppableStateSnapshot, DroppableProvided, DraggableProvided, DraggableStateSnapshot, NotDraggingStyle, DraggingStyle, DropResult, ResponderProvided } from 'react-beautiful-dnd';

import { CharacterClass, getClassDisplayName } from "../data/CharacterClass";
import Tooltip from "@material-ui/core/Tooltip";

export interface ClassChangeSingleLevelProps
{
    classes : Array<CharacterClass>;
    disabled : boolean;
    onReordered : (newClasses : Array<CharacterClass>) => void;
    onDeleted : (newClasses : Array<CharacterClass>) => void;
}

interface ClassChipProps
{
    value : CharacterClass;
    provided? : DraggableProvided;
    snapshot? : DraggableStateSnapshot;
    disabled? : boolean;
    onDelete : () => void;
}

function getClassChipStyle(isDragging : boolean, draggableStyle : DraggingStyle | NotDraggingStyle | undefined) : React.CSSProperties
{
    return {
        marginLeft : 4,
        marginRight: 4,
        userSelect : 'none',
        ...draggableStyle
    };
}

function ClassChip(props : ClassChipProps)
{
    if (props.provided !== undefined && props.snapshot !== undefined)
    {
        // If draggable
        return (
            <div
                ref={props.provided.innerRef}
                {...props.provided.draggableProps}
                {...props.provided.dragHandleProps}
                style={getClassChipStyle(props.snapshot.isDragging, props.provided.draggableProps.style)}>
                <Chip 
                    icon={<DragIndicatorIcon />}
                    label={getClassDisplayName(props.value)}
                    onDelete={() => {props.onDelete();}}
                    color={props.disabled ? "default" : "primary"}
                    clickable={false}
                    style={{cursor: 'move'}}
                />
            </div>
        );
    }
    else
    {
        return (
            <div
                style={getClassChipStyle(false, {})}>
                <Chip 
                    label={getClassDisplayName(props.value)}
                    onDelete={() => {props.onDelete();}}
                    color={props.disabled ? "default" : "primary"}
                    clickable={false}
                />
            </div>
        );
    }
}

function getClassChip (isDisabled : boolean, value : CharacterClass, index : number, onDelete : () => void, 
    provided? : DraggableProvided, snapshot? : DraggableStateSnapshot) : JSX.Element
{
    if (isDisabled)
    {
        return (
            <ClassChip
                key={index}
                value={value}
                onDelete={onDelete}
                provided={provided}
                snapshot={snapshot}
                disabled
            />);
    }
    else
    {
        return (
            <ClassChip
                key={index}
                value={value}
                onDelete={onDelete}
                provided={provided}
                snapshot={snapshot}
            />);
    }
};

const DropContainerStyle : React.CSSProperties = {
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    flexGrow: 0,
    flexWrap: "nowrap",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft : 4,
    paddingRight : 4,
    minHeight : 32,
};

const DragOverStyle : React.CSSProperties = {
    paddingTop: 7,
    paddingBottom: 7,
    borderTop: "1px solid #aaaaaa",
    borderBottom: "1px solid #aaaaaa",
};

function dropContainerStyle(isDraggingOver : boolean) : React.CSSProperties
{
    if (isDraggingOver)
    {
        console.log("over");
        return {...DropContainerStyle, ...DragOverStyle};
    }
    else
    {
        return DropContainerStyle;
    }
}

export function ClassChangeSingleLevel(props : ClassChangeSingleLevelProps) : JSX.Element
{
    const onDeleteHandler = (index : number, characterClass : CharacterClass) => {
        const newClassList = [...props.classes];
        newClassList.splice(index, 1);
        props.onDeleted(newClassList);
    };

    let draggableItems : Array<JSX.Element> = [];

    if (props.classes.length <= 1)
    {
        // Not draggable if nothing useful to be accomplished by dragging.
        draggableItems = props.classes.map((value, ind) => {
            const index = ind;
            return getClassChip(props.disabled, value, ind, () => {onDeleteHandler(index, value)});
        });
    }
    else
    {
        draggableItems = props.classes.map((value, ind) => {
            const index = ind;
            return (
                <Draggable key={index} draggableId={index.toString()} index={index}>
                    {(provided : DraggableProvided, snapshot : DraggableStateSnapshot) => 
                        getClassChip(props.disabled, value, ind, () => onDeleteHandler(index, value), provided, snapshot)
                    }
                </Draggable>
            );
        });
    }

    const dragEndHandler = (result : DropResult, provided : ResponderProvided) => {
        if (!result.destination) {
            return;
        }

        const newList = [...props.classes];
        const srcIndex = result.source.index;
        const destIndex = result.destination.index;

        const elem = newList[srcIndex];
        newList.splice(srcIndex, 1);
        newList.splice(destIndex, 0, elem);
        props.onReordered(newList);
    };

    if (props.classes.length <= 1)
    {
        return (
            <div style={dropContainerStyle(false)}>
                {draggableItems}
            </div>);
    }
    else
    {
        return (
            <DragDropContext onDragEnd={dragEndHandler}>
                <Droppable droppableId="classChangeRow" direction="horizontal">
                    {(provided : DroppableProvided, snapshot : DroppableStateSnapshot) => (
                        <Tooltip title="Drag to re-order class changes.">
                            <div
                                ref={provided.innerRef}
                                style={dropContainerStyle(snapshot.isDraggingOver)}
                                {...provided.droppableProps}
                            >
                                {draggableItems}
                                {provided.placeholder}
                            </div>
                        </Tooltip>
                    )}
                </Droppable>
            </DragDropContext>
        );   
    }
}