/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from "react";
import Card from "@material-ui/core/Card";
import Typography from "@material-ui/core/Typography";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Tooltip } from "recharts";
import { getClassDisplayName } from "../data/CharacterClass";
import { getCharacterDisplayName } from "../data/CharacterName";
import { getFinalClassAtLevelForProfile } from "../model/CharacterProfile";
import { AnalysisComponent, AnalysisReport } from "../model/PageManager";
import { clamp } from "../model/Util";
import { computeDistributionMedianForSingleStat, DistributionsByStat, getDistributionByStatIndex } from "../sim/GrowthResultAccumulator";
import { areEqualStats, forEachStatIndex, getCanonicalStatNameByIndex, initStats, mapStatArray, StatArray, zeroStats } from "../sim/StatArray";
import { SERIES_COLOR_SCHEMES } from "./ChartColorScheme";
import { StatArraySelector } from "./InitialStatsEditor";
import HelpIcon from '@material-ui/icons/Help';
import * as _MuiTooltip from '@material-ui/core/Tooltip/Tooltip';
const MuiTooltip = _MuiTooltip.default;

export interface LuckAnalysisReportProps
{
    report : AnalysisReport;
    selectedLevel : number;
    reportIterationCounter : number;
}

interface LuckAnalysisReportState
{
    referenceStats : StatArray;
}

// map of stat name to percentile rank
interface StatRankingRaw
{
    below: number;
    same: number;
    above: number;
}

interface ChartDatum
{
    stat : string;
    median : number;
    reference : number;
}

type StatPercentileRanks = Map<string, StatRankingRaw>;

export interface SingleProfileReportProps
{
    distributions : DistributionsByStat;
    ranks : StatPercentileRanks;
    // Used for color coding
    profileIndex : number;
    characterName : string;
}

const ReferenceStatContainerStyle : React.CSSProperties = {
    display : "flex",
    flexGrow: 0,
    flexShrink: 0,
    flexDirection : "row",
    flexBasis : 0,
    flexWrap : "wrap",
    justifyContent: "flex-start",
};

const ReferenceStatElementStyle : React.CSSProperties = {
    display : "flex",
    flexGrow : 0,
    flexShrink : 0,
};

const RngRatingExplanation : JSX.Element = <span>The RNG rating is a number from 0 to 1 (or &quot;WTF&quot;) representing how good the character's RNG luck was.
    0.5 means average luck. &quot;WTF&quot; means the character's RNG luck was simultaneously impossibly good and impossibly bad.
    RNG rating is calculated as P<sub>b</sub> / (P<sub>a</sub> + P<sub>b</sub>). 
    <br />
    P<sub>a</sub> is the probability that, if the character's levelups were rerolled,
    all resulting stats would be equal or better. P<sub>b</sub> is the probability that, if rerolled, all stats would be equal or worse.
    </span>;

function computeChartData(distributions : DistributionsByStat, ranks : StatPercentileRanks) : ChartDatum[]
{
    const data : ChartDatum[] = forEachStatIndex((index : number) => {
        const statName = getCanonicalStatNameByIndex(index);
        const medianData = computeDistributionMedianForSingleStat(distributions, index);

        if (medianData === undefined)
        {
            const serializedDistribution = JSON.stringify(Object.fromEntries(getDistributionByStatIndex(distributions, index).entries()));
            throw new Error(`Unexpected: distribution with no calculable median. Stat ${statName}, distribution: ${serializedDistribution}`);
        }

        // Display percentile is the midpoint of the probability range in order to quantize in a representative way that
        // the 50th percentile is skewed a bit.
        const medianDisplayPercentile = medianData.pLower + 0.5 * medianData.pMedian;
        const rank = ranks.get(statName);

        if (rank === undefined)
        {
            throw new Error(`Failed to look up rank percentile because key ${statName} was missing. Should be a canonical stat name.`);
        }

        const rankDisplayPercentile = rank.below + 0.5 * rank.same;

        return {
            stat: statName,
            median: medianDisplayPercentile,
            reference: rankDisplayPercentile
        };
    });

    return data;
}

function computeStatSplit(distribution : Map<number, number>, referenceStat : number) : [number, number, number]
{
    let below : number = 0.0;
    let same : number = 0.0;
    let above : number = 0.0;

    for(const bucket of distribution.keys())
    {
        const p = distribution.get(bucket) as number;

        if (bucket < referenceStat)
        {
            below += p;
        }
        else if (bucket > referenceStat)
        {
            above += p;
        }
        else
        {
            same += p;
        }
    }

    return [below, same, above];
}

function computePercentileRanks(referenceStats : StatArray, singleReportComponent : AnalysisComponent, selectedLevel : number) : StatPercentileRanks
{
    const distribution = singleReportComponent.result.get(selectedLevel);

    if (distribution === undefined)
    {
        throw new RangeError(`No stat distribution found for level ${selectedLevel}.`);
    }

    // for each stat, compute rank
    const splits = mapStatArray(referenceStats, (referenceStat, index) => {
        // We ignore the "same" values
        return computeStatSplit(getDistributionByStatIndex(distribution, index), referenceStat);
    });

    const result = new Map<string, StatRankingRaw>();
    splits.forEach((value, index) => {
        const [below, same, above] = value;
        result.set(getCanonicalStatNameByIndex(index), {below, same, above});
    });

    return result;
}

function computeLuckQuotient(ranks : StatPercentileRanks) : number
{
    let belowOrSameProduct = 1.0;
    let aboveOrSameProduct = 1.0;

    //console.log("Calculating rank splits");
    for (const ranking of ranks.values())
    {
        belowOrSameProduct *= (ranking.below + ranking.same);
        aboveOrSameProduct *= (ranking.above + ranking.same);

        //console.log(`Below/above: ${(ranking.below + ranking.same)}/${(ranking.above + ranking.same)}`);
    }

    // Adding in the "same" component because "strictly more" can result in losing resolution
    const denominator = belowOrSameProduct + aboveOrSameProduct;
    return belowOrSameProduct / denominator;
}

const ContainerStyle : React.CSSProperties = {
};

const SingleReportContainerStyle : React.CSSProperties = {
    padding: 8,
    marginTop: 16
};

const ProfileHeadingContainerStyle : React.CSSProperties = {
};

const ProfileNameSegmentStyle : React.CSSProperties = {
};

const LuckQuotientHighlight : React.CSSProperties = {
    fontSize: 24,
    fontWeight: 'bold'
};

export function SingleProfileReport(props: SingleProfileReportProps) : JSX.Element
{
    const areaFill = SERIES_COLOR_SCHEMES[props.profileIndex].baseColor;
    // Hack.
    const areaOutline = SERIES_COLOR_SCHEMES[props.profileIndex].medianValueColor;
    
    // Layered, produces the region effect we need
    const medianFill = "#bbbbbb";
    const medianOutline = "#bbbbbb";

    // TODO: figure out visualization that captures percentile ranges for the reference stat instead of point value
    const chartData : ChartDatum[] = computeChartData(props.distributions, props.ranks);
    //console.log(chartData);

    return <RadarChart outerRadius={90} width={400} height={300} data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="stat" />
            <PolarRadiusAxis domain={[0.0,1.0]} />
            <Radar name="Median" dataKey="median" stroke={medianOutline} fill={medianFill} fillOpacity={0.4} />
            <Radar name={`${props.characterName}`} dataKey="reference" stroke={areaOutline} fill={areaFill} fillOpacity={0.4} />
            <Tooltip formatter={(n : number) => `${(n * 100).toFixed(2)}%`} labelFormatter={(label : string) => `${label.toUpperCase()} Percentile Ranking`}/>
            <Legend />
        </RadarChart>;
}

function computeMedianStatsFromReport(report : AnalysisReport) : StatArray
{
    let newReferenceStats = zeroStats();

    // Default to median of first profile, if available.
    if (report.components.length > 0)
    {
        const referenceDistributions = report.components[0].result;
        const referenceSourceLevel = report.components[0].profile.endLevel;
        const referenceDistribution = referenceDistributions.get(referenceSourceLevel);

        if (referenceDistribution === undefined)
        {
            throw new Error("Generated report is missing distributions for end level, indicates report generation error.");
        }

        newReferenceStats = forEachStatIndex((index) => {
            const medianDetails = computeDistributionMedianForSingleStat(referenceDistribution, index);
            if (medianDetails === undefined)
            {
                throw new Error("Failed to get median from a single-stat-distribution, indicates report generation error.")
            }
            return medianDetails.median;
        }) as StatArray;
    }

    return newReferenceStats;
}

//export class LuckAnalysisReport(props : LuckAnalysisReportProps) : JSX.Element
export class LuckAnalysisReport extends React.Component<LuckAnalysisReportProps, LuckAnalysisReportState>
{
    constructor(props : LuckAnalysisReportProps)
    {
        super(props);
        this.state = {referenceStats : computeMedianStatsFromReport(props.report)};
    }

    public shouldComponentUpdate(nextProps : LuckAnalysisReportProps, nextState : LuckAnalysisReportState) : boolean
    {
        if (!areEqualStats(this.state.referenceStats, nextState.referenceStats))
        {
            return true;
        }
        else if (nextProps.reportIterationCounter !== this.props.reportIterationCounter)
        {
            return true;
        }
        else if (nextProps.selectedLevel !== this.props.selectedLevel)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    public render() : JSX.Element
    {
        const onReferenceStatsChanged = (newStats : StatArray) => {
            this.setState({referenceStats : newStats});
        };

        const reportBlocks = this.props.report.components.map((component, index) => {
            const useLevel = clamp(this.props.selectedLevel, component.profile.startLevel, component.profile.endLevel);
            const distributionsByStat = component.result.get(useLevel);
            
            if (distributionsByStat === undefined)
            {
                throw new RangeError("Missing data for a level that was already clamped.");
            }
    
            const characterName = getCharacterDisplayName(component.profile.character);
            const characterClass=  getClassDisplayName(getFinalClassAtLevelForProfile(component.profile, useLevel))
            const positions = computePercentileRanks(this.state.referenceStats, component, useLevel);;
            const luckQuotient = computeLuckQuotient(positions);

            const luckQuotientText = isNaN(luckQuotient) ? "WTF" : luckQuotient.toFixed(6);

            const characterTextColor = SERIES_COLOR_SCHEMES[index].medianValueColor;
    
            return (
                <Card style={SingleReportContainerStyle} key={`rngreport-card-${index}`}>
                    <div style={ProfileHeadingContainerStyle}>
                        <Typography variant="body1" style={ProfileNameSegmentStyle}>
                            How good would these stats be for&nbsp;
                            <span style={{color: characterTextColor, fontWeight: 'bold'}}>{characterName}</span>
                            &nbsp;as a&nbsp;
                            <span style={{color: characterTextColor, fontWeight: 'bold'}}>level {useLevel} {characterClass}</span>?
                        </Typography>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline'}}>
                        <div style={{flexBasis: 'auto', flexGrow: 0, flexShrink: 0}}>
                            <Typography variant="body2">RNG rating:</Typography>
                        </div>
                        <div style={{flexBasis: 'auto', flexGrow: 0, flexShrink: 0}}>
                            <Typography style={LuckQuotientHighlight}>{luckQuotientText}</Typography>
                        </div>
                        <div style={{flexBasis: 'auto', flexGrow: 0, flexShrink: 0, position: 'relative', top: 1}}>
                            <MuiTooltip title={RngRatingExplanation}>
                                <HelpIcon fontSize='small'/>
                            </MuiTooltip>
                        </div>
                    </div>
                    <div>
                        <SingleProfileReport ranks={positions} profileIndex={index} distributions={distributionsByStat} characterName={characterName}/>
                    </div>
                </Card>
            );
        });
    
        return <div style={ContainerStyle}>
            <Typography variant="body1">
                    Your Character's Stats
                </Typography>
            <StatArraySelector
                minimums={zeroStats()}
                maximums={initStats(150)}
                value={this.state.referenceStats}
                onChanged={(stats) => {onReferenceStatsChanged(stats)}}
                containerStyle={ReferenceStatContainerStyle}
                elementStyle={ReferenceStatElementStyle}/>
            {reportBlocks}
        </div>;
    }   
}