/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Tooltip from '@material-ui/core/Tooltip';
import React from 'react';
import { StatLimitMods } from '../data/CharacterData';

export interface MaxStatLimitModEditorProps
{
    status : StatLimitMods;
    onChanged : (status : StatLimitMods) => void;
    containerStyle? : React.CSSProperties
}

const CONTAINER_STYLE : React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    alignContent: "flex-start",
};

// Widget for selecting max stat limits. 
export function MaxStatLimitModEditor(props : MaxStatLimitModEditorProps) : JSX.Element
{
    const _stats_changed = (strAndSpd? : boolean, lckAndCha? : boolean, magAndDex? : boolean, defAndRes? : boolean) => {
        const newStatuses : StatLimitMods = {
            ...props.status
        };

        if (strAndSpd !== undefined)
        {
            newStatuses.StrAndSpdUp = strAndSpd;
        }

        if (lckAndCha !== undefined)
        {
            newStatuses.LckAndChaUp = lckAndCha;
        }

        if (magAndDex !== undefined)
        {
            newStatuses.MagAndDexUp = magAndDex;
        }

        if (defAndRes !== undefined)
        {
            newStatuses.DefAndResUp = defAndRes;
        }

        props.onChanged(newStatuses);
    };

    return (
    <div style={{...CONTAINER_STYLE, ...props.containerStyle}}>
        <FormGroup row>
            <Tooltip title="Statue of Saint Cichol remodeling bonus">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={props.status.StrAndSpdUp}
                            onChange={(event) => _stats_changed(event.target.checked, undefined, undefined, undefined)}
                            name="Cichol"
                            color="primary"
                        />
                    
                    }
                    label="+5 max Str &amp; Spd"
                    style={{userSelect: "none"}}
                />
            </Tooltip>
            <Tooltip title="Statue of Saint Cethleann remodeling bonus">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={props.status.LckAndChaUp}
                            onChange={(event) => _stats_changed(undefined, event.target.checked, undefined, undefined)}
                            name="Cethleann"
                            color="primary"
                        />
                    }
                    label="+5 max Lck &amp; Cha"
                    style={{userSelect: "none"}}
                />
            </Tooltip>
            <Tooltip title="Statue of Saint Macuil remodeling bonus">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={props.status.MagAndDexUp}
                            onChange={(event) => _stats_changed(undefined, undefined, event.target.checked, undefined)}
                            name="Macuil"
                            color="primary"
                        />
                    }
                    label="+5 max Mag &amp; Dex"
                    style={{userSelect: "none"}}
                />
            </Tooltip>
            <Tooltip title="Statue of Saint Indech remodeling bonus">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={props.status.DefAndResUp}
                            onChange={(event) => _stats_changed(undefined, undefined, undefined, event.target.checked)}
                            name="Indech"
                            color="primary"
                        />
                    }
                    label="+5 max Def &amp; Res"
                    style={{userSelect: "none"}}
                />
            </Tooltip>
        </FormGroup>
    </div>);
}