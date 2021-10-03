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
import { CharacterProfile, deserializeCharacterProfileFromJson } from "../model/CharacterProfile";

export interface ImportProfileDialogProps
{
    open : boolean;
    onCancelled : () => void;
    onProfileLoaded : (profile : CharacterProfile) => void;
}

export function ImportProfileDialog(props : ImportProfileDialogProps) : JSX.Element
{
    const [importString, setImportString] = useState("");

    const closeHandler = async () => {
        props.onCancelled();
    };

    const parseResult = deserializeCharacterProfileFromJson(importString);

    const importHandler = async () => {
        setImportString("");
        props.onProfileLoaded(parseResult.result as CharacterProfile);
    };

    return (
        <Dialog open={props.open} onClose={closeHandler}>
            <DialogTitle>
                Import Character Code
            </DialogTitle>
            <DialogContent>
                <TextField
                    multiline
                    label="Character Code"
                    variant="filled"
                    value={importString}
                    rowsMax={6}
                    style={{minWidth: 500, marginBottom: 4}}
                    onChange={event => setImportString(event.target.value)}
                    error={importString.trim().length > 0 && parseResult.error !== undefined}
                    helperText={importString.trim().length > 0 ? parseResult.error as string : undefined}
                    />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeHandler} color="default">Cancel</Button>
                <Button onClick={importHandler} color="primary" disabled={parseResult.error !== undefined}>Import</Button>
            </DialogActions>
        </Dialog>
    );
}
