/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataSeries } from './ProbabilityDisplay';
import { SERIES_COLOR_SCHEMES } from "./ChartColorScheme";

export interface RechartProbabilityDisplayProps
{
    // X axis
    minBin? : number;
    maxBin? : number;

    // Y axis
    maxValue? : number;
    minValue : number;

    statLabel : string;

    dataSeries : DataSeries[];

    size? : [number,number];

    style? : React.CSSProperties;
}

export interface RechartProbabilityDisplayState
{

}

interface ChartDatum extends Record<string,number>
{
    bin : number;
}

type ChartData = ChartDatum[];

export class EmptyDataSeriesError extends Error
{
    constructor(message : string) 
    {
        super(message);
        this.name = "EmptyDataSeriesError";
    }
}

const minReducer = (a : number, b : number) => Math.min(a,b);
const maxReducer = (a : number, b : number) => Math.min(a,b);

function reduceKeys<T>(m : Map<number,T>, reducer : (a : number, b : number) => number) : number
{
    return Array.from(m.keys()).reduce(reducer);
}

function computeChartData(props : RechartProbabilityDisplayProps) : [ChartData, string[]]
{
    if (props.dataSeries.some(d => d.probabilityValues.size === 0))
    {
        throw new EmptyDataSeriesError("At least one of the data series has no data points.");
    }

    let dataPoints : ChartData = [];
    const seriesNames : string[] = props.dataSeries.map(d => d.name);

    let leftLimit : number = props.minBin ?? props.dataSeries.map(d => reduceKeys(d.probabilityValues, minReducer)).reduce(minReducer);
    let rightLimit : number = props.maxBin ?? props.dataSeries.map(d => reduceKeys(d.probabilityValues, maxReducer)).reduce(maxReducer);

    // Pad the left/right bounds to look better
    if (leftLimit > 0)
    {
        leftLimit--;
    }
    rightLimit++;

    for (let i = leftLimit; i <= rightLimit; i++)
    {
        let point : ChartDatum = {
            bin : i
        };

        props.dataSeries.forEach(series => {
            const maybeBinValue = series.probabilityValues.get(i);
            if (maybeBinValue !== undefined)
            {
                point[series.name] = maybeBinValue as number;
            }
            else
            {
                point[series.name] = 0;
            }
        });

        dataPoints.push(point);
    }

    return [dataPoints, seriesNames];
}

function computeAverageLines(props : RechartProbabilityDisplayProps) : Array<JSX.Element | null>
{
    return props.dataSeries.map((d, index) => {
        const avgValue = d.averageValue;
        if (avgValue !== undefined)
        {
            const avgXCoord = Math.round(avgValue).toString();
            return <ReferenceLine 
                x={avgXCoord}
                stroke={SERIES_COLOR_SCHEMES[index].medianValueColor}
                key={`avgline-${index}`}
                label={`Median`}/>;
        }
        else
        {
            return null;
        }
    });
}

function probabilityValueFormatter(value : number, decimalDigits : number) : string
{
    return `${(value * 100).toFixed(decimalDigits)}%`;
}

function labelFormatter(prefix: string, number: number) : string
{
    return `${prefix}: ${number}`;
}

export class RechartProbabilityDisplay extends React.Component<RechartProbabilityDisplayProps, RechartProbabilityDisplayState>
{
    private containerRef : React.RefObject<HTMLDivElement>;

    constructor(props : RechartProbabilityDisplayProps)
    {
        super(props);

        this.containerRef = React.createRef<HTMLDivElement>();
    }

    render() : JSX.Element
    {
        const [chartData, seriesKeys] = computeChartData(this.props);
        //const referenceLines = computeReferenceLines(this.props);
        const averageLines = computeAverageLines(this.props);
        
        const areaGraphs = seriesKeys.map((seriesKey : string, index : number) => {
            return <Area 
                type="step" 
                dataKey={seriesKey} 
                stroke={SERIES_COLOR_SCHEMES[index].baseHighlightColor} 
                key={`area-${index}`} 
                fillOpacity={0.7}
                fill={SERIES_COLOR_SCHEMES[index].baseColor}/>
        });

        const maxValue = this.props.maxValue ?? this.props.dataSeries.map(d => Array.from(d.probabilityValues.values()).reduce(maxReducer)).reduce(maxReducer);

        const containerStyle : React.CSSProperties = {};

        if (this.props.size !== undefined)
        {
            containerStyle.width = this.props.size[0];
            containerStyle.height = this.props.size[1];
        }
        else if (this.containerRef.current !== null)
        {
            //containerStyle.width = "100%";
            containerStyle.height = Math.round(this.containerRef.current.getBoundingClientRect().width * 0.3);
        }
        else 
        {
            // Sensible defaults for a 1080p screen
            //containerStyle.width = "100%"
            containerStyle.height = 300;
        }

        return <div ref={this.containerRef} style={{...containerStyle, ...(this.props.style ?? {})}}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 10, right: 20, left: 20, bottom: 10}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin">
                    </XAxis>
                    <YAxis domain={[this.props.minValue, maxValue]} tickFormatter={(x : any) => probabilityValueFormatter(Number.parseFloat(x), 0)}>
                    </YAxis>
                    <Tooltip formatter={(x : any) => probabilityValueFormatter(Number.parseFloat(x), 2)} labelFormatter={(n) => labelFormatter(this.props.statLabel, n)}/>
                    {averageLines}
                    {areaGraphs}
                    <Legend />
                </AreaChart>
            </ResponsiveContainer>
        </div>;
    }
}
