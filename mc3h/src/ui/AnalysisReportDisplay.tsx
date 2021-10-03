/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from "react";
import { getCharacterDisplayName } from "../data/CharacterName";
import { AnalysisComponent, AnalysisReport } from "../model/PageManager";
import { clamp } from "../model/Util";
import { computeDistributionMedianForSingleStat, DistributionsByStat } from "../sim/GrowthResultAccumulator";
import { getCanonicalStatNameByIndex, iCHA, iDEF, iDEX, iHP, iLCK, iMAG, iRES, iSPD, iSTR, iTOTAL } from "../sim/StatArray";
import { AnalysisSingleStatDisplay } from "./AnalysisSingleStatDisplay";

interface AnalysisReportDisplayProps
{
    report : AnalysisReport | null;
    selectedLevel : number;
}

export function getReportMinLevel(report : AnalysisReport | null) : number
{
    if (report === null)
    {
        return -1;
    }
    else
    {
        // Default level choice is the highest level number in the computation
        return report.components.map(v => v.profile.startLevel).reduce((p, c) => Math.min(p, c));
    }
}

export function getReportMaxLevel(report : AnalysisReport | null) : number
{
    if (report === null)
    {
        return -1;
    }
    else
    {
        // Default level choice is the highest level number in the computation
        return report.components.map(v => v.profile.endLevel).reduce((p, c) => Math.max(p, c));
    }
}

const StatDescriptionsByIndex : Map<number, string> = new Map<number, string>();
StatDescriptionsByIndex.set(iHP, "The probability (y-axis) that the character's HP will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iSTR, "The probability (y-axis) that the character's STR will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iMAG, "The probability (y-axis) that the character's MAG will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iDEX, "The probability (y-axis) that the character's DEX will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iSPD, "The probability (y-axis) that the character's SPD will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iLCK, "The probability (y-axis) that the character's LCK will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iDEF, "The probability (y-axis) that the character's DEF will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iRES, "The probability (y-axis) that the character's RES will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iCHA, "The probability (y-axis) that the character's CHA will end up at that value (x-axis) at the chosen level.");
StatDescriptionsByIndex.set(iTOTAL, "The probability (y-axis) that the character will gain that many stat points (x-axis) when advancing to the chosen level.");

function getStatDescriptionByIndex(statIndex : number) : string
{
    const r = StatDescriptionsByIndex.get(statIndex);
    if (r === undefined)
    {
        throw new RangeError(`Unknown StatArray index ${statIndex}`);
    }
    else
    {
        return r;
    }
}

function getKeyBounds(statDistribution : Map<number, number>) : [number, number]
{
    return Array.from(statDistribution.keys())
        .map(v => [v, v] as [number, number])
        .reduce((p, n) => [Math.min(p[0], n[0]), Math.max(p[1], n[1])]);
}

function floorWithPrecision(n : number, digits : number) : number
{
    const scale = Math.pow(10.0, digits);
    return Math.floor(n * scale) / scale;
}

function ceilWithPrecision(n : number, digits : number) : number
{
    const scale = Math.pow(10.0, digits);
    return Math.ceil(n * scale) / scale;
}

function getStatBounds(report : AnalysisReport, selectedLevel : number) : [number, number, number, number, number, number, number]
{
    return report.components.map(entry => {
        const levelToUse = clamp(selectedLevel, entry.profile.startLevel, entry.profile.endLevel);
        const statDistributions = entry.result.get(levelToUse);

        if (statDistributions === undefined)
        {
            throw new RangeError("This error should not happen: stat probability distribution was not computed for the 'level to use'.");
        }

        const [hpLowerBound, hpUpperBound] = getKeyBounds(statDistributions.hp);
        const [totalLowerBound, totalUpperBound] = getKeyBounds(statDistributions.levelupTotal);
        const [restLowerBound, restUpperBound] = [
            statDistributions.str,
            statDistributions.mag,
            statDistributions.dex,
            statDistributions.spd,
            statDistributions.lck,
            statDistributions.def,
            statDistributions.res,
            statDistributions.cha]
        .map(v => getKeyBounds(v))
        .reduce((p, n) => [Math.min(p[0], n[0]), Math.max(p[1], n[1])]);

        const highestBinProbabilitiesByStat = [
            statDistributions.str,
            statDistributions.mag,
            statDistributions.dex,
            statDistributions.spd,
            statDistributions.lck,
            statDistributions.def,
            statDistributions.res,
            statDistributions.cha]
        .map(v => Math.max(...v.values()));
        const highestBinProbability = Math.max(...highestBinProbabilitiesByStat);

        return [hpLowerBound, hpUpperBound, restLowerBound, restUpperBound, totalLowerBound, totalUpperBound, highestBinProbability] as [number, number, number, number, number, number, number]
    }).reduce((p, n) => [
        floorWithPrecision(Math.min(p[0], n[0]), 2),
        ceilWithPrecision(Math.max(p[1], n[1]), 2),
        floorWithPrecision(Math.min(p[2], n[2]), 2),
        ceilWithPrecision(Math.max(p[3], n[3]), 2),
        floorWithPrecision(Math.min(p[4], n[4]), 2),
        ceilWithPrecision(Math.max(p[5], n[5]), 2),
        ceilWithPrecision(Math.max(p[6], n[6]), 2)
    ]);
}

export function computeDistributionMedian(analysisComponent : AnalysisComponent, levelToUse : number, index: number) : number | undefined
{
    const distribution : DistributionsByStat | undefined = analysisComponent.result.get(levelToUse);
    if (distribution === undefined)
    {
        throw new RangeError(`Cannot compute distribution average because data for level ${levelToUse} is not available in distribution.`);
    }

    const medianDetails = computeDistributionMedianForSingleStat(distribution, index);
    return medianDetails === undefined ? undefined : medianDetails.median;
}

interface PartialStatDisplayProps
{
    seriesNames : string[];
    series : Array<Map<number, number>>;
    averageValues : Array<number | undefined>;
}

function getSingleStatDisplayProps(report: AnalysisReport, statIndex: number, selectedLevel : number) : PartialStatDisplayProps
{
    const seriesLevelToUse = report.components.map(c => clamp(selectedLevel, c.profile.startLevel, c.profile.endLevel));
    const seriesNames = report.components.map((c, index) => `(#${index+1}) ${getCharacterDisplayName(c.profile.character)} lvl ${seriesLevelToUse[index]}`);

    const series = report.components.map((c, index) => {
        const data = c.result.get(seriesLevelToUse[index]);
        if (data === undefined)
        {
            console.error(`"Level to use" is missing from results. Theoretical bounds are ${c.profile.startLevel} to ${c.profile.endLevel}.`);
            // Soft failure.
            return new Map<number, number>();
        }
        else
        {
            switch (statIndex)
            {
                case iHP:
                    return data.hp;
                case iSTR:
                    return data.str;
                case iMAG:
                    return data.mag;
                case iDEX:
                    return data.dex;
                case iSPD:
                    return data.spd;
                case iLCK:
                    return data.lck;
                case iDEF:
                    return data.def;
                case iRES:
                    return data.res;
                case iCHA:
                    return data.cha;
                case iTOTAL:
                    return data.levelupTotal;
                default:
                    throw new RangeError(`Unrecognized index for a stat component: ${statIndex}`);
            }
        }
    });

    const averageValues = report.components.map((c, index) => computeDistributionMedian(c, seriesLevelToUse[index], statIndex));

    return {
        seriesNames,
        series,
        averageValues
    };
}

export class AnalysisReportDisplay extends React.Component<AnalysisReportDisplayProps>
{
    // No state object
    public shouldComponentUpdate(nextProps : AnalysisReportDisplayProps) : boolean
    {
        return (this.props.selectedLevel !== nextProps.selectedLevel) 
            || (nextProps.report?.cacheToken !== this.props.report?.cacheToken);
    }

    public render() : JSX.Element
    {
        if (this.props.report === null)
        {
            return <></>;
        }

        const report = this.props.report;
        //const [minHpValue, maxHpValue, minRestValue, maxRestValue, minTotalValue, maxTotalValue, highestProbability] = getStatBounds(report, this.props.selectedLevel);
        const [minHpValue, maxHpValue, minRestValue, maxRestValue, , , highestProbability] = getStatBounds(report, this.props.selectedLevel);

        const maxProbabilty = Math.max(highestProbability, 0.3) + 0.01;

        return <div style={{marginTop: 16}}>
            <div style={{marginTop: 16}}>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iHP, this.props.selectedLevel)} 
                    minValue={minHpValue} maxValue={maxHpValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iHP)}
                    caption={getStatDescriptionByIndex(iHP)}/>

                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iSTR, this.props.selectedLevel)} 
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iSTR)}
                    caption={getStatDescriptionByIndex(iSTR)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iMAG, this.props.selectedLevel)} 
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iMAG)}
                    caption={getStatDescriptionByIndex(iMAG)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iDEX, this.props.selectedLevel)} 
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iDEX)}
                    caption={getStatDescriptionByIndex(iDEX)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iSPD, this.props.selectedLevel)}
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iSPD)}
                    caption={getStatDescriptionByIndex(iSPD)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iLCK, this.props.selectedLevel)}
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iLCK)}
                    caption={getStatDescriptionByIndex(iLCK)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iDEF, this.props.selectedLevel)} 
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iDEF)}
                    caption={getStatDescriptionByIndex(iDEF)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iRES, this.props.selectedLevel)}
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iRES)}
                    caption={getStatDescriptionByIndex(iRES)}/>
                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iCHA, this.props.selectedLevel)} 
                    minValue={minRestValue} maxValue={maxRestValue} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iCHA)}
                    caption={getStatDescriptionByIndex(iCHA)}/>

                <AnalysisSingleStatDisplay {...getSingleStatDisplayProps(report, iTOTAL, this.props.selectedLevel)} 
                    minValue={0} maxValue={9} maxProbability={maxProbabilty} 
                    title={getCanonicalStatNameByIndex(iTOTAL)}
                    caption={getStatDescriptionByIndex(iTOTAL)}/>
            </div>
        </div>;
    }
}
