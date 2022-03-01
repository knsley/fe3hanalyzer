/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from 'react';
import { useState } from 'react';
import FormLabel from '@material-ui/core/FormLabel';
import Button from '@material-ui/core/Button';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { CharacterClass } from '../data/CharacterClass';
import { areEquivalentStatLimitMods, StatLimitMods } from '../data/CharacterData';
import { CharacterName } from '../data/CharacterName';
import { getEligibleClasses } from '../data/ClassData';
import { ClassChange, GrowthProfile, validateClassProfile } from '../sim/GrowthProfile';
import { areEqualStats } from '../sim/StatArray';
import { CharacterProfile } from '../model/CharacterProfile';
import { ClassChangeEditor } from './ClassChangeEditor';
import { InitialStatsEditor } from './InitialStatsEditor';
import { LevelSelector } from './LevelSelector';
import { MaxStatLimitModEditor } from './MaxStatLimitModEditor';
import { CharacterThumbnail } from './CharacterThumbnail';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { InitialStats } from '../data/CharacterPresetLoader';
import { ExportProfileDialog } from './ExportProfileDialog';
import { ImportProfileDialog } from './ImportProfileDialog';

function removeUnusedClassChanges(profile : CharacterProfile) : Array<ClassChange>
{
    return profile.changes.filter((classChange) => classChange.level >= profile.startLevel && classChange.level <= profile.endLevel);
}

export function getGrowthProfileFromCharacterProfile(profile : CharacterProfile) : GrowthProfile
{
    const filteredClassChanges = removeUnusedClassChanges(profile);
    const growthProfile : GrowthProfile = {
        startLevel: profile.startLevel,
        startClass: profile.startClass,
        startStats: [...profile.startStats],
        changes: filteredClassChanges,
        endLevel: profile.endLevel,
    };

    if (!validateClassProfile(growthProfile))
    {
        throw new Error("Class changes are out of order in character profile.");
    }

    return growthProfile;
}

// Compares normalized profiles and returns whether they are equivalent. 
// This results in disregarding extraneous class changes.
export function areEquivalentCharacterProfile(left : CharacterProfile, right : CharacterProfile) : boolean
{
    if (left.character !== right.character
        || left.startLevel !== right.startLevel
        || left.startClass !== right.startClass
        || !areEqualStats(left.startStats, right.startStats)
        || left.endLevel !== right.endLevel
        || !areEquivalentStatLimitMods(left.maxStatMods, right.maxStatMods))
    {
        return false;
    }

    // Normalize to compare.
    const leftChanges = removeUnusedClassChanges(left);
    const rightChanges = removeUnusedClassChanges(right);
    if (leftChanges.length !== rightChanges.length
        || leftChanges.some((c, i) => c.level !== rightChanges[i].level || c.class !== rightChanges[i].class))
    {
        return false;
    }
    else
    {
        return true;
    }
}

export interface CharacterProfileBuilderProps
{
    profile : CharacterProfile;
    // Default false
    showDeleteButton? : boolean;
    onProfileChange : (profile : CharacterProfile) => void;
    onDeleteClicked : () => void;
}

const CharacterCardStyle : React.CSSProperties = {
    margin: 8,
    overflow: "visible",
};

const ContainerStyle : React.CSSProperties = {
    display: 'flex',
    flexBasis : "auto",
    flexWrap : "nowrap",
    flexDirection: "row",
    alignItems: "flex-start",
    alignContent: "flex-start",
};

const RemoveProfileButtonStyle : React.CSSProperties = {
    display: 'block',
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0
};

const CharacterStatsContainer : React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flexBasis: 'auto',
    flexShrink: 1,
    flexGrow: 1,
    alignItems: 'flex-start',
    alignContent: 'baseline',
    width: '756px',
}

// Based on empirically measured values, because it's good enough (tm)
const THUMBNAIL_WIDTH = 128;
const THUMBNAIL_HEIGHT = 128;

const CharacterThumbnailLayout : React.CSSProperties = {
    display : "block",
    flexGrow : 0,
    flexShrink : 0
}

const OtherSettingsContainerStyle : React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    alignContent: "flex-start",
    flexBasis: 0,
    marginTop: 16,
    marginRight: 0,
    marginLeft: 16,
};

const OtherSettingsControlRow : React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flexBasis: 0,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "flex-start",
    alignContent: "flex-start",
    paddingTop: 8,
};

const ThumbnailColumnStyle : React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flexBasis: 'auto',
    flexShrink: 0,
    flexGrow: 0,
    marginTop: 8
};

const CharacterImportExportButtonsStyle : React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flexBasis: 'auto',
    flexShrink: 1,
    flexGrow: 1,
    marginTop: 4
};

function classChangeListToMap(list : Array<ClassChange>) : Map<number, Array<CharacterClass>>
{
    const map = new Map<number, Array<CharacterClass>>();
    for (const entry of list)
    {
        const changesForLevel = map.get(entry.level);
        if (changesForLevel !== undefined)
        {
            changesForLevel.push(entry.class);
        }
        else
        {
            map.set(entry.level, [entry.class]);
        }
    }
    return map;
}

function flattenClassChanges(changes : Map<number, Array<CharacterClass>>) : Array<ClassChange>
{
    const list : Array<ClassChange> = [];

    const levels = Array.from(changes.keys());
    levels.sort((a, b) => a - b);
    
    for (const level of levels)
    {
        for (const c of (changes.get(level) as Array<CharacterClass>))
        {
            list.push({
                level : level,
                class : c
            });
        }
    }

    return list;
}

function getReconciledClassChanges(initialStats : InitialStats, classChanges : Array<ClassChange>) : Array<ClassChange>
{
    const eligibleClasses = getEligibleClasses(initialStats.character);

    // Delete class changes for ineligible classes.
    return classChanges.filter((classChange) => eligibleClasses.has(classChange.class));
}

function getReconciledEndLevel(initialStats : InitialStats, classChanges : Array<ClassChange>, endLevel : number) : number
{
    let candidate = Math.max(initialStats.level, endLevel);

    if (classChanges.length > 0)
    {
        candidate = Math.max(candidate, classChanges[classChanges.length - 1].level);
    }

    return candidate;
}

function getInitialStatsFromProfile(character : CharacterName, profile : GrowthProfile) : InitialStats
{
    return {
        character : character,
        class : profile.startClass,
        level : profile.startLevel,
        stats : [...profile.startStats],
    };
}

// Component that builds a character profile for stats analysis.
export function CharacterProfileBuilder(props : CharacterProfileBuilderProps) : JSX.Element
{
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const _max_stat_mods_change = (newMods : StatLimitMods) => {
        props.onProfileChange({
            ...props.profile,
            maxStatMods : newMods
        });
    };

    const _initial_stats_editor_change = (newInitialStats : InitialStats) => {
        const reconciledClassChangeList = getReconciledClassChanges(newInitialStats, props.profile.changes);
        const reconciledEndLevel = getReconciledEndLevel(newInitialStats, reconciledClassChangeList, props.profile.endLevel);

        props.onProfileChange({
            ...props.profile,
            character : newInitialStats.character,
            startLevel : newInitialStats.level,
            startClass : newInitialStats.class,
            startStats : [...newInitialStats.stats],
            changes : reconciledClassChangeList,
            endLevel : reconciledEndLevel,
        });
    };

    const _handle_class_change_list_changed = (newClassChangeList : Map<number, Array<CharacterClass>>) => {
        const flattenedClassChanges = flattenClassChanges(newClassChangeList);
        const reconciledEndLevel = getReconciledEndLevel(getInitialStatsFromProfile(props.profile.character, props.profile), flattenedClassChanges, props.profile.endLevel);

        props.onProfileChange({
            ...props.profile,
            changes : flattenedClassChanges,
            endLevel : reconciledEndLevel,
        });
    };

    const _handle_end_level_changed = (newEndLevel : number) => {
        props.onProfileChange({
            ...props.profile,
            endLevel : newEndLevel,
        });
    };

    const maybeRemoveButton = (!!props.showDeleteButton)
        ? <div style={RemoveProfileButtonStyle}><Button color="secondary" disableElevation onClick={() => props.onDeleteClicked()}><RemoveCircleIcon /></Button></div>
        : null;

    // Nice surprise for some people. 20 because that's how Normal mode works.
    const useTimeskipThumbnail = props.profile.startLevel >= 20;

    return (
    <Card style={CharacterCardStyle} variant="outlined">
        <CardContent>
            <div style={ContainerStyle}>
                <div style={ThumbnailColumnStyle}>
                    <CharacterThumbnail 
                        character={props.profile.character} 
                        width={THUMBNAIL_WIDTH} 
                        height={THUMBNAIL_HEIGHT} 
                        style={CharacterThumbnailLayout}
                        timeskip={useTimeskipThumbnail}/>
                    <div style={CharacterImportExportButtonsStyle}>
                        <Button size="small" onClick={() => setImportDialogOpen(true)}>Import</Button>
                        <Button size="small" onClick={() => setExportDialogOpen(true)}>Export</Button>
                    </div>
                    <ExportProfileDialog
                        open={exportDialogOpen}
                        profile={props.profile}
                        onClose={() => setExportDialogOpen(false)}
                        />
                    <ImportProfileDialog
                        open={importDialogOpen}
                        onCancelled={() => setImportDialogOpen(false)}
                        onProfileLoaded={(profile) => {setImportDialogOpen(false); props.onProfileChange(profile)}}
                        />
                </div>
                <div style={CharacterStatsContainer}>
                    <InitialStatsEditor 
                        character={props.profile.character} 
                        class={props.profile.startClass}
                        level={props.profile.startLevel}
                        stats={props.profile.startStats}
                        maxStatMods={props.profile.maxStatMods}
                        handler={_initial_stats_editor_change}
                    />
                    <div style={OtherSettingsContainerStyle}>
                        <FormLabel>Analysis Settings</FormLabel>
                        <LevelSelector
                                minLevel={props.profile.startLevel}
                                customText="Target level: "
                                labelStyle="inline"
                                value={props.profile.endLevel}
                                onSelected={_handle_end_level_changed}
                            />
                    </div>
                    <div style={{display: "flex", alignItems: "flex-start", flexDirection: "column", marginTop: 8, marginLeft: 16}}>
                        <FormLabel style={{marginBottom: 8}}>Class Changes</FormLabel>
                        <ClassChangeEditor
                            character={props.profile.character}
                            classChangeList={classChangeListToMap(props.profile.changes)}
                            minLevel={props.profile.startLevel}
                            onClassChangeListChange={_handle_class_change_list_changed}
                        />
                    </div>
                    <div style={OtherSettingsContainerStyle}>
                        <FormLabel>Other Settings</FormLabel>
                        <div style={OtherSettingsControlRow}>
                            <MaxStatLimitModEditor status={props.profile.maxStatMods} onChanged={_max_stat_mods_change} containerStyle={{marginLeft: 16}}/>
                        </div>
                    </div>
                </div>
                {maybeRemoveButton}
            </div>
        </CardContent>
    </Card>);
}