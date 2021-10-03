/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CSSProperties } from 'react';
import { CharacterThumbnailProps, CharacterToThumbnailMap } from '../data/CharacterThumbnails';

export function CharacterThumbnail(props : CharacterThumbnailProps)
{
    const path = CharacterToThumbnailMap.get(props.character);

    if (path === undefined)
    {
        const style : CSSProperties = {
            display : "block",
            color : "white",
            width : props.width,
            height : props.height,
            backgroundColor : "#aaaaaa",
            fontSize : (props.height * 0.5).toFixed(0) + "px",
            lineHeight : props.height + "px",
            textAlign : "center",
            verticalAlign : "middle",
            ...props.style
        };

        return (
            <div style={style}>?</div>
        );
    }
    else
    {
        let style : CSSProperties = {
            display : "block",
            width : props.width,
            height : props.height,
            backgroundColor : "transparent",
            objectFit : "contain",
            ...props.style
        };

        if (!props.timeskip)
        {
            return (
                <img src={path.preSkip} style={style} alt={props.character.toString() + " Thumbnail"} />
            );
        }
        else
        {
            return (
                <img src={path.postSkip ?? path.preSkip} style={style} alt={props.character.toString() + " Thumbnail"} />
            );
        }
    }
}