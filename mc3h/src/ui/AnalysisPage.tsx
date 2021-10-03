/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as React from "react";
import { getAppContext, IAppContextValue } from "../model/AppContext";
import { CharacterProfile, getCharacterProfileHash } from "../model/CharacterProfile";
import { AnalysisComponent, AnalysisReport, INVALID_PAGE_LISTENER_HANDLE, IPageManager, PageData } from "../model/PageManager";
import { GrowthResultAccumulator, StatDistributionsByLevel } from "../sim/GrowthResultAccumulator";
import { CharacterProfileBuilder, getGrowthProfileFromCharacterProfile } from "./CharacterProfileBuilder";
import { SERIES_COLOR_SCHEMES } from "./ChartColorScheme";
import { AnalysisReportDisplay, getReportMaxLevel, getReportMinLevel } from "./AnalysisReportDisplay";
import { LuckAnalysisReport } from "./LuckAnalysisReport";
import { LevelSelector } from "./LevelSelector";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import Typography from "@material-ui/core/Typography";
import CardContent from "@material-ui/core/CardContent";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Container from "@material-ui/core/Container";
import { ExportDataDialog } from "./ExportDataDialog";

export interface AnalysisPageProps
{
    pageId : number;
}

export interface AnalysisPageState
{
    resultsComputed : boolean;
    results : StatDistributionsByLevel[] | null;
    profileBlockExpansion : boolean[];
    selectedReportLevel : number;
    exportDataDialogOpen : boolean;
}

function getDefaultAnalysisPageState() : AnalysisPageState
{
    return {
        resultsComputed : false,
        results : null,
        profileBlockExpansion : [],
        selectedReportLevel : 1000,
        exportDataDialogOpen : false,
    }
}

function getMaxProfileCount() : number
{
    // However many colors we can show is how many profiles you can pack into the charts
    return SERIES_COLOR_SCHEMES.length;
}

// TODO : Find more elegant way to do this.
let reportGenerationCounter : number = 0;

function generateAnalysisReport(profiles: CharacterProfile[]) : AnalysisReport
{
    const accumulators = profiles.map(p => {
        const growthProfile = getGrowthProfileFromCharacterProfile(p);
        const mods = p.maxStatMods;
        return new GrowthResultAccumulator(p.character, growthProfile, mods);
    });

    const distributions = accumulators.map(accum => {
        accum.compute();
        return accum.getDistributions();
    });

    const components : AnalysisComponent[] = distributions.map((distribution, index) => ({
        profile : profiles[index],
        result : distribution
    }));

    reportGenerationCounter++;

    return {
        components : components,
        cacheToken : reportGenerationCounter
    };
}

const AddProfileButtonContainerStyle : React.CSSProperties = {
    padding: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
};

const AddProfileButtonStyle : React.CSSProperties = {
    display: 'block',
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0
}

// A page contains multiple profiles and possibly the analyses for the outcomes.

export class AnalysisPage extends React.Component<AnalysisPageProps, AnalysisPageState>
{
    private listenerHandle : number;
    private reportIterationCounter : number;

    constructor(props : AnalysisPageProps)
    {
        super(props);
        this.state = getDefaultAnalysisPageState();

        this.listenerHandle = INVALID_PAGE_LISTENER_HANDLE;
        this.reportIterationCounter = 0;
    }

    componentDidMount() : void
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        this.attachListener(pageManager, this.props.pageId);
    }

    componentDidUpdate(prevProps : AnalysisPageProps, prevState : AnalysisPageState, snapshot : any) : void
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        if (this.props.pageId !== prevProps.pageId)
        {
            this.detachListener(pageManager, prevProps.pageId);
            this.attachListener(pageManager, this.props.pageId);

            this.reconcilePageState(pageManager);
        }
    }

    componentWillUnmount() : void
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        this.detachListener(pageManager, this.props.pageId);
    }

    render() : JSX.Element
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        const pageDataRef = pageManager.getPageData(this.props.pageId);

        const onSelectedLevelChanged = (newSelectedLevel : number) => {
            this.setState({selectedReportLevel: newSelectedLevel})
        };

        const exportDataButtonClicked = () => {
            this.setState({exportDataDialogOpen : true});
        };

        const onExportDataDialogClosed = () => {
            this.setState({exportDataDialogOpen : false});
        };

        let maybeAddProfileButton : JSX.Element | null = null;
        if (pageDataRef.profiles.length < getMaxProfileCount())
        {
            maybeAddProfileButton = <Button 
                                    variant="contained" 
                                    disableElevation 
                                    onClick={() => this.onAddProfileClicked()} 
                                    color="primary" 
                                    style={AddProfileButtonStyle}>
                                        Add Profile
                                    </Button>;
        }
        else
        {
            maybeAddProfileButton = <Button 
                                    variant="contained" 
                                    disableElevation
                                    disabled
                                    style={AddProfileButtonStyle}>
                                        Max Profiles Added
                                    </Button>;
        }

        const computeReportButtonColor = this.state.resultsComputed ? "default" : "primary";
        const computeReportButton = <Button 
                                    variant="contained" 
                                    disableElevation 
                                    color={computeReportButtonColor}
                                    onClick={() => this.onGenerateReportClicked()}>
                                        Generate Report
                                    </Button>;

        const profileBlock = <div>
            {pageDataRef.profiles.map((characterProfile, index) => this.renderProfile(pageDataRef, characterProfile, index))}
            <div style={AddProfileButtonContainerStyle}>{maybeAddProfileButton}</div>
        </div>;

        const rnjesusDisplay = (pageDataRef.report === null)
            ? null
            : <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} id="rejesus_display">
                    <Typography variant="h6" style={{flexBasis: "33%", flexShrink: 0, textAlign: "start"}}>
                        RNJesus Luck Analysis
                    </Typography>
                    <Typography variant="h6" style={{opacity: 0.5}}>click to open</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Container>
                        <LuckAnalysisReport 
                            report={pageDataRef.report}
                            reportIterationCounter={this.reportIterationCounter}
                            selectedLevel={this.state.selectedReportLevel}/>
                    </Container>
                </AccordionDetails>
            </Accordion>;

        const reportBlock = pageDataRef.report === null
            ? null
            : <Card style={{padding: 16, marginTop: 16}}>
                <Button style={{float: 'right'}} variant="contained" color="default" onClick={exportDataButtonClicked}>Export Data</Button>
                <Typography variant="h6" style={{textAlign: "start"}}>
                    Individual Stat Breakdown
                </Typography>
                <ExportDataDialog open={this.state.exportDataDialogOpen} onClose={onExportDataDialogClosed} report={pageDataRef.report as AnalysisReport}/>
                <AnalysisReportDisplay 
                    report={pageDataRef.report as AnalysisReport}
                    selectedLevel={this.state.selectedReportLevel}/>
            </Card>;

        const levelSelector = pageDataRef.report === null
            ? null
            : <div style={{margin: 16}}>
                <LevelSelector
                    minLevel={getReportMinLevel(pageDataRef.report)}
                    maxLevel={getReportMaxLevel(pageDataRef.report)}
                    value={this.state.selectedReportLevel}
                    customText="View results for level:"
                    labelStyle="inline"
                    onSelected={onSelectedLevelChanged}/>
            </div>;

        return <div style={{maxWidth: 1000}}>
            {profileBlock}
            <Card variant="outlined" style={{margin: 8}}>
                <CardContent style={{textAlign: "start"}}>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <div style={{flexBasis: 'auto', flexShrink: 0, flexGrow: 0}}>
                            <Typography variant="h5" style={{textAlign: "start"}}>
                                Analysis
                            </Typography>
                        </div>
                        <div style={{flexBasis: 'auto', flexShrink: 0, flexGrow: 1, marginLeft: 24}}>
                            {computeReportButton}
                        </div>
                    </div>
                    {levelSelector}
                    {rnjesusDisplay}
                    {reportBlock}
                </CardContent>
            </Card>
        </div>;
    }

    private onGenerateReportClicked() : void
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        const pageDataRef = pageManager.getPageData(this.props.pageId);
        const report = generateAnalysisReport(pageDataRef.profiles);
        this.reportIterationCounter++;
        
        pageManager.updateAnalysis(this.props.pageId, report);

        this.setState({
            resultsComputed: true,
            selectedReportLevel: getReportMaxLevel(report)
        });
    }

    private onAddProfileClicked() : void
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        pageManager.newProfile(this.props.pageId);
        this.setState({resultsComputed: false});
    }

    private onRemoveProfileClicked(index : number)
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        pageManager.deleteProfile(this.props.pageId, index);
        this.setState({resultsComputed: false});
    }

    private profileChanged(newProfile : CharacterProfile, index : number)
    {
        const pageManager = (this.context as IAppContextValue).pageManager;
        pageManager.updateProfile(this.props.pageId, index, newProfile);
        this.setState({resultsComputed: false});
    }

    private renderProfile(pageDataRef : PageData, characterProfile : CharacterProfile, index : number)
    {
        // If last profile, do not allow delete, only edit.
        const showDeleteButton = pageDataRef.profiles.length > 1;

        return <CharacterProfileBuilder 
            key={index}
            profile={characterProfile}
            showDeleteButton={showDeleteButton}
            onProfileChange={(newProfile) => this.profileChanged(newProfile, index)}
            onDeleteClicked={() => this.onRemoveProfileClicked(index)} />;
    }

    private attachListener(pageManager : IPageManager, page : number) : void
    {
        this.listenerHandle = pageManager.addPageListener(page, (pageNumber, pageData) => {this.onPageUpdated(pageNumber, pageData)});
    }

    private detachListener(pageManager : IPageManager, page : number) : void
    {
        pageManager.removePageListener(page, this.listenerHandle);
        this.listenerHandle = INVALID_PAGE_LISTENER_HANDLE;
    }

    private onPageUpdated(page : number, pageData : PageData) : void
    {
        this.forceUpdate();
    }

    private reconcilePageState(pageManager : IPageManager) : void
    {
        const pageData = pageManager.getPageData(this.props.pageId);

        let newBlockExpansion = Array.from(this.state.profileBlockExpansion);
        if (pageData.profiles.length > this.state.profileBlockExpansion.length)
        {
            const tailLength = pageData.profiles.length - this.state.profileBlockExpansion.length;
            newBlockExpansion = newBlockExpansion.concat(Array<boolean>(tailLength).fill(false))
        }
        else if (pageData.profiles.length < this.state.profileBlockExpansion.length)
        {
            newBlockExpansion = newBlockExpansion.slice(0, pageData.profiles.length);
        }

        if (pageData.report !== null)
        {
            const profilesMatched : boolean = 
                pageData.profiles.length === pageData.report.components.length
                && pageData.report.components
                    .map(c => c.profile)
                    .every((oldProfile, index) => {
                        const newProfile = pageData.profiles[index];
                        const hashNew = getCharacterProfileHash(newProfile.character, getGrowthProfileFromCharacterProfile(newProfile), newProfile.maxStatMods);
                        const hashOld = getCharacterProfileHash(oldProfile.character, getGrowthProfileFromCharacterProfile(oldProfile), oldProfile.maxStatMods);
                        return hashNew === hashOld;
                    });

            this.setState({
                resultsComputed : profilesMatched,
                results : pageData.report.components.map(component => component.result),
                profileBlockExpansion : newBlockExpansion
            });
        }
        else
        {
            this.setState({
                resultsComputed : false,
                results : null,
                profileBlockExpansion : newBlockExpansion
            });
        }
    }
}
AnalysisPage.contextType = getAppContext().Context;
