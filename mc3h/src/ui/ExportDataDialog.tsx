/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import { getClassDisplayName } from "../data/CharacterClass";
import { getCharacterDisplayName } from "../data/CharacterName";
import { AnalysisReport } from "../model/PageManager";
import { exportAnalysisReportToCsv } from "../model/AnalysisReportExport";

export interface ExportDataDialogProps
{
    open : boolean;
    report : AnalysisReport;
    onClose : () => void;
}

interface ExportDataDialogState
{
}

export class ExportDataDialog extends React.Component<ExportDataDialogProps, ExportDataDialogState>
{
    private dataBlobUrl : string | null;
    
    constructor(props : ExportDataDialogProps)
    {
        super(props);
        
        this.state = {};

        this.dataBlobUrl = null;
    }

    private async downloadDataBlob()
    {
        if (this.dataBlobUrl !== null)
        {
            this.clearDataBlob();
        }

        this.dataBlobUrl = URL.createObjectURL(exportAnalysisReportToCsv(this.props.report));

        const aElem = document.createElement('a');
        aElem.href = (this.dataBlobUrl as string);
        aElem.target = "_blank";
        aElem.download = "analysis-report.csv";
        aElem.click();
    }

    private async clearDataBlob()
    {
        if (this.dataBlobUrl !== null)
        {
            URL.revokeObjectURL(this.dataBlobUrl);
            this.dataBlobUrl = null;
        }
    }

    public render() : JSX.Element
    {
        const closeHandler = async () => {
            await this.clearDataBlob();
            this.props.onClose();
        };
    
        const profileStrings = this.props.report.components.map(c => c.profile).map((p, index) => {
            const endClass = p.changes.length > 0 ? p.changes[p.changes.length - 1].class : undefined;
    
            return <Typography variant="body2" key={`export-label-${index}`}>
                {(index + 1).toString()}. {getCharacterDisplayName(p.character)} lvl. {p.startLevel.toString()} {getClassDisplayName(p.startClass)}
                &nbsp;&#x2192;&nbsp;
                lvl. {p.endLevel.toString()} {endClass !== undefined ? getClassDisplayName(endClass) : ""}
            </Typography>;
        });
    
        return (
                <Dialog open={this.props.open} onClose={closeHandler}>
                    <DialogTitle>
                        Export Analysis Report
                    </DialogTitle>
                    <DialogContent style={{minWidth: 400, minHeight: 100}}>
                        <Typography variant="subtitle1">Exporting probability distributions for:</Typography>
                        {profileStrings}
                        <br style={{height: 16}}/>
                        <Button variant="contained" color="primary" onClick={() => this.downloadDataBlob()}>Download</Button>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeHandler} color="default">Close</Button>
                    </DialogActions>
                </Dialog>
        );
    }
}