/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import HelpIcon from '@material-ui/icons/Help';
import { DataSeries } from './ProbabilityDisplay';
import { RechartProbabilityDisplay } from './RechartProbabilityDisplay';

type SingleStatAnalysisResult = Map<number, number>;
export interface AnalysisSingleStatDisplayProps
{
    title : string;
    caption : string;

    seriesNames : string[];
    series : SingleStatAnalysisResult[];
    averageValues : Array<number | undefined>;
    
    size? : [number, number];

    minValue : number;
    maxValue : number;
    maxProbability : number;
}

// Hack to address a problem where Rechart area charts don't render areas right with single values.
function padSingleValueResultMap(resultMap : SingleStatAnalysisResult) : SingleStatAnalysisResult
{
    return resultMap;
}

function computeDataSeries(seriesNames : string[], series : SingleStatAnalysisResult[], averages : Array<number | undefined>) : DataSeries[]
{
    return series.map((single, index) => ({
        name : seriesNames[index],
        probabilityValues : single.size > 1 ? single : padSingleValueResultMap(single),
        averageValue: averages[index]
    }));
}

const OuterLayoutStyle : React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyItems: "flex-start",
    alignItems: "center"
};

const ChartTitleStyle : React.CSSProperties = {
    display: "flex",
    flexBasis: "auto",
    flexShrink: 0,
    flexGrow: 0,
    alignContent: "center",
    justifyContent: "center",
    textTransform: "uppercase",
    verticalAlign: "middle"
};

const ChartBodyStyle : React.CSSProperties = {
    display: "block",
    flexBasis: "auto",
    flexShrink: 0,
    flexGrow: 1
};

export function AnalysisSingleStatDisplay(props : AnalysisSingleStatDisplayProps) : JSX.Element
{
    const dataSeries : DataSeries[] = computeDataSeries(props.seriesNames, props.series, props.averageValues);

    return <div style={OuterLayoutStyle}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline', minWidth: 80}}>
            <div style={{flexBasis: 'auto', flexGrow: 0, flexShrink: 0}}>
                <Typography variant="h6" style={ChartTitleStyle}>{props.title}</Typography>
            </div>
            <div style={{flexBasis: 'auto', flexGrow: 0, flexShrink: 0, position: 'relative', top: 2}}>
                <Tooltip title={props.caption}>
                    <HelpIcon fontSize='small'/>
                </Tooltip>
            </div>
        </div>
        <RechartProbabilityDisplay 
            style={ChartBodyStyle}
            size={props.size} 
            minBin={props.minValue} 
            maxBin={props.maxValue} 
            minValue={0.0} 
            maxValue={props.maxProbability} 
            dataSeries={dataSeries}
            statLabel={props.title.toLocaleUpperCase()}
        />
    </div>;
}
