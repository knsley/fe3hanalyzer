/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { CharacterName } from '../data/CharacterName';
import { InitialStats, loadInitialStatsPresets, Preset, PresetsBundle } from '../data/CharacterPresetLoader';
import { CharacterSelector } from './CharacterSelector';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import { getClassDisplayName } from '../data/CharacterClass';
import { forEachStatIndex, getCanonicalStatNameByIndex } from '../sim/StatArray';
import Typography from '@material-ui/core/Typography';

export interface InitialStatPresetDialogProps
{
    open : boolean;
    defaultCharacter : CharacterName;
    onCancelled : () => void;
    onSelected : (loadedStats : InitialStats) => void;
}

export interface PresetSelectorProps
{
    selectedIndex : number;
    onSelected : (index : number) => void;
    availablePresets : Preset[];
}

export interface PresetDisplayProps
{
    value : InitialStats
}

function getStatBundle(character : CharacterName, index : number) : InitialStats | undefined
{
    // Pull a lazy-initialized list of presets
    const AvailablePresets : PresetsBundle = loadInitialStatsPresets();

    const presets = AvailablePresets.getPresetsForCharacter(character);
    if (presets.length > index)
    {
        return AvailablePresets.getPresetsForCharacter(character)[index].stats;
    }
    else
    {
        return undefined;
    }
}

type SelectChangedEvent = React.ChangeEvent<{name?: string, value: unknown}>;

export function PresetSelector(props : PresetSelectorProps) : JSX.Element
{
    const handler = (event : SelectChangedEvent, child?: React.ReactNode) => {
        const selected = parseInt((event.target.value as any).toString());
        props.onSelected(selected);
    };

    const presetEntries : JSX.Element[] = props.availablePresets.map((preset : Preset) => {
        return <option value={preset.index} key={preset.index}>{preset.displayName}</option>;
    });

    return (
        <FormControl style={{marginTop: 16, marginBottom: 16}}>
            <InputLabel htmlFor="character-selector-field">Preset</InputLabel>
            <Select native value={props.selectedIndex} onChange={handler}>
                {presetEntries}
            </Select>
        </FormControl>);
}

const PresetDisplayRowStyle : React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8
};

const PresetDisplayElementStyle : React.CSSProperties = {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    marginRight: 12,
    marginTop: 8,
    marginBottom: 8,
    minWidth: 32
};

const PresetDisplayLabelStyle : React.CSSProperties = {
};

const PresetDisplayValueStyle : React.CSSProperties = {
    //fontWeight: 'normal'
    fontWeight: 'bold',
    opacity: 0.8
};

export function PresetDisplay(props : PresetDisplayProps) : JSX.Element
{
    return (
        <div>
            <div style={PresetDisplayRowStyle}>
                <div style={PresetDisplayElementStyle}>
                    <Typography variant='body1' style={PresetDisplayLabelStyle}>Level</Typography>
                    <Typography variant='body1' style={PresetDisplayValueStyle}>{props.value.level}</Typography>
                </div>
                <div style={PresetDisplayElementStyle}>
                    <Typography variant='body1' style={PresetDisplayLabelStyle}>Class</Typography>
                    <Typography variant='body1' style={PresetDisplayValueStyle}>{getClassDisplayName(props.value.class)}</Typography>
                </div>
            </div>
            <div style={PresetDisplayRowStyle}>
                {
                    forEachStatIndex((index : number) => {
                        const statDisplayName = getCanonicalStatNameByIndex(index);
                        return (
                            <div style={PresetDisplayElementStyle} key={`preset_stat_${getCanonicalStatNameByIndex(index)}`}>
                                <Typography variant='body1' style={PresetDisplayLabelStyle}>{statDisplayName}</Typography>
                                <Typography variant='body1' style={PresetDisplayValueStyle}>{props.value.stats[index]}</Typography>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

export interface InitialStatPresetDialogState
{
    selectedCharacter : CharacterName;
    selectedPresetIndex : number;
}

export class InitialStatPresetDialog extends React.Component<InitialStatPresetDialogProps, InitialStatPresetDialogState>
{
    public constructor(props : InitialStatPresetDialogProps)
    {
        super(props);

        this.state = {
            selectedCharacter : props.defaultCharacter,
            selectedPresetIndex: 0
        };
    }

    public componentDidUpdate(prevProps : InitialStatPresetDialogProps, prevState : InitialStatPresetDialogState)
    {
        if (prevProps.defaultCharacter !== this.props.defaultCharacter)
        {
            this.setState({
                selectedCharacter : this.props.defaultCharacter,
                selectedPresetIndex : 0
            });
        }
    }

    public render() : JSX.Element
    {
        // Pull a lazy-initialized list of presets
        const AvailablePresets : PresetsBundle = loadInitialStatsPresets();

        const presetsForSelectedCharacter = AvailablePresets.getPresetsForCharacter(this.state.selectedCharacter);
        const selectedPreset = getStatBundle(this.state.selectedCharacter, this.state.selectedPresetIndex);

        const onPresetSelected = () => {
            if (selectedPreset !== undefined)
            {
                this.props.onSelected(selectedPreset as InitialStats);
            }
        };
    
        const onCharacterChange = (newCharacterSelection : CharacterName) => {
            this.setState({
                selectedCharacter: newCharacterSelection,
                selectedPresetIndex: 0
            });
        };
    
        const onPresetIndexSelected = (newIndexSelection : number) => {
            this.setState({
                selectedCharacter: this.state.selectedCharacter,
                selectedPresetIndex: newIndexSelection
            })
        };

        // TODO: Factor null preset into preset selector and preset display to make UI size consistent.
        const presetSelectionDisplay : JSX.Element | null = selectedPreset === undefined
            ?   <>
                    <Typography variant="body1" style={{marginTop: 16}}>No available presets.</Typography>
                </>
            :   <>
                    <PresetSelector 
                        selectedIndex={this.state.selectedPresetIndex}
                        onSelected={(index : number) => onPresetIndexSelected(index)}
                        availablePresets={presetsForSelectedCharacter}/>
                    <PresetDisplay value={selectedPreset}/>
                </>;

        const selectableCharacters = AvailablePresets.getCharacterList();
        if (!selectableCharacters.has(this.state.selectedCharacter))
        {
            selectableCharacters.add(this.state.selectedCharacter);
        }

        return (
            <Dialog open={this.props.open} onClose={() => this.props.onCancelled()}>
                <DialogTitle>
                    Common Starting Stats
                </DialogTitle>
                <DialogContent>
                    <CharacterSelector
                        value={this.state.selectedCharacter} 
                        onSelected={(c : CharacterName) => onCharacterChange(c)}
                        availableCharacters={selectableCharacters}/>
                    {presetSelectionDisplay}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.props.onCancelled()} color="default">Cancel</Button>
                    <Button onClick={() => onPresetSelected()} color="primary" disabled={selectedPreset === undefined}>Load Stats</Button>
                </DialogActions>
            </Dialog>
        );
    }
}