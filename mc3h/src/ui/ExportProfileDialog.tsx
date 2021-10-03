/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { useState } from "react";
import { CharacterProfile, serializeCharacterProfileToJson } from "../model/CharacterProfile";


export interface ExportProfileDialogProps
{
    open : boolean;
    profile : CharacterProfile;
    onClose : () => void;
}

export function ExportProfileDialog(props : ExportProfileDialogProps) : JSX.Element
{
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);

    const profileJson = props.open ? serializeCharacterProfileToJson(props.profile) : "";

    const copyHandler = async () => {
        await navigator.clipboard.writeText(serializeCharacterProfileToJson(props.profile));
        setShowCopiedMessage(true);
    };

    const closeHandler = async () => {
        setShowCopiedMessage(false);
        props.onClose();
    };

    return (
        <Dialog open={props.open} onClose={closeHandler}>
            <DialogTitle>
                Export Character Code
            </DialogTitle>
            <DialogContent>
                <TextField
                    multiline
                    label="Character Code"
                    variant="filled"
                    value={profileJson}
                    rowsMax={6}
                    style={{minWidth: 500, marginBottom: 4}}
                    />
                <Button variant="contained" color="primary" onClick={copyHandler}>Copy to Clipboard</Button>
                {
                    showCopiedMessage
                        ? <Button variant="text" disabled style={{color: "#222222"}}>Copied!</Button>
                        : null
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={closeHandler} color="default">Close</Button>
            </DialogActions>
        </Dialog>
    );
}