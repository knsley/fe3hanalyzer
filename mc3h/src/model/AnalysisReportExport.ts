/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass, getClassDisplayName } from "../data/CharacterClass";
import { CharacterName, getCharacterDisplayName } from "../data/CharacterName";
import { ClassChange } from "../sim/GrowthProfile";
import { DistributionsByStat, getDistributionByStatIndex } from "../sim/GrowthResultAccumulator";
import { forEachStatIndex, getCanonicalStatNameByIndex, iTOTAL } from "../sim/StatArray";
import { CharacterProfile } from "./CharacterProfile";
import { AnalysisReport } from "./PageManager";

const ordinalNumberCompare = (a : number, b : number) => a - b;

function getCsvHeader() : string
{
    return "ProfileIndex,Character,Class,Level,Stat,Value,Probability";
}

function toCsvRow(componentIndex: number, character: CharacterName, characterClass : string, lvl: number, statName: string, bucket: number, probability: number): string
{
    return `${componentIndex},${getCharacterDisplayName(character)},${characterClass},${lvl.toString()},${statName},${bucket},${probability}`;
}

function computeClassNamesByLevel(profile : CharacterProfile) : Map<number,CharacterClass>
{
    const values = new Map<number, CharacterClass>();
    let levelCounter = profile.startLevel;
    let currentClass = profile.startClass;
    // sort to normalize, although sorted order might be an invariant
    let classChanges = [...profile.changes].reverse();

    console.log([...classChanges]);
    
    while(levelCounter <= profile.endLevel)
    {
        // Pop off all class changes to pick the last one.
        while (classChanges.length > 0 && levelCounter === classChanges[classChanges.length - 1].level)
        {
            const c = classChanges.pop();
            currentClass = (c as ClassChange).class;
        }
        
        // Set the last class for each level.
        values.set(levelCounter, currentClass);

        levelCounter++;
    }

    return values;
}

export function exportAnalysisReportToCsv(report : AnalysisReport) : Blob
{
    const header = getCsvHeader();

    const lines : string[] = report.components.flatMap((component, componentIndex) => {
        const classesByLevel : Map<number,CharacterClass> = computeClassNamesByLevel(component.profile);

        const levels = Array.from(component.result.keys()).sort(ordinalNumberCompare);
        return levels.flatMap(lvl => {
            const characterClass = getClassDisplayName(classesByLevel.get(lvl) as CharacterClass);
            const distributions = component.result.get(lvl) as DistributionsByStat;

            const rows : string[] = [];
            // Canonical stats
            forEachStatIndex(iStat => {
                const statName = getCanonicalStatNameByIndex(iStat);
                const dist = getDistributionByStatIndex(distributions, iStat);

                const statBuckets = Array.from(dist.keys()).sort(ordinalNumberCompare);
                
                statBuckets.map(bucket => {
                    const probability = dist.get(bucket) as number;
                    return toCsvRow(componentIndex, component.profile.character, characterClass, lvl, statName, bucket, probability);
                }).forEach(line => rows.push(line));
            })

            // Total
            const totalLevelupDistribution = getDistributionByStatIndex(distributions, iTOTAL);
            const totalLevelupBuckets = Array.from(totalLevelupDistribution.keys()).sort(ordinalNumberCompare);
            const totalLevelupStatName = "levelup-total";
            totalLevelupBuckets.map(bucket => {
                const probability = totalLevelupDistribution.get(bucket) as number;
                return toCsvRow(componentIndex, component.profile.character, characterClass, lvl, totalLevelupStatName, bucket, probability);
            }).forEach(line => rows.push(line));

            return rows;
        });
    });

    const allData = [header, ...lines].join("\n");
    return new Blob([allData], {type: 'text/csv;charset=utf-8'});
}

