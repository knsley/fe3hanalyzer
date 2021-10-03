/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Card from "@material-ui/core/Card";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import InfoIcon from '@material-ui/icons/Info';

import GithubIcon from "../images/GitHub-Mark-32px.png";

import AboutDocsAssetUrl from './docs/about.md';
import DocumentationAssetUrl from './docs/docs.md';
import FaqAssetUrl from './docs/faq.md';

const AboutDocsUrlSuffix = "docs/about.md";
const DocumentationUrlSuffix = "docs/docs.md";
const FaqUrlSuffix = "docs/faq.md"

export interface FaqEntryProps
{
    index : number;
    question : string | JSX.Element;
    answer : string | JSX.Element;
}

export interface HeaderAndDocumentationProps
{

}

const LinksTrayStyle : React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16
};

const MenuIconStyle : React.CSSProperties = {
    display: "inline",
    marginBottom: -5,
    marginLeft: 16,
    paddingRight: 2
};

const GithubPagesRegex = /(\w+).github.io/i;

export function HeaderAndDocumentation(props : HeaderAndDocumentationProps) : JSX.Element
{
    const hostname = window.location.hostname;
    const segmentsMatch = hostname.match(GithubPagesRegex);

    let urlPrefix : string | undefined = undefined;
    if (segmentsMatch !== null)
    {
        const gitUser = segmentsMatch[1];
        urlPrefix = `https://github.com/${gitUser}/fe3hanalyzer/blob/main/`;
    }

    const FaqUrl = urlPrefix === undefined ? FaqAssetUrl : urlPrefix + FaqUrlSuffix;
    const DocumentationUrl = urlPrefix === undefined ? DocumentationAssetUrl : urlPrefix + DocumentationUrlSuffix;
    const AboutDocsUrl = urlPrefix === undefined ? AboutDocsAssetUrl : urlPrefix + AboutDocsUrlSuffix;

    const RepositoryUrl = urlPrefix ?? "#";

    return <div style={{display: 'flex', width: 1000, flexDirection: 'row'}}>
        <Card style={{margin: 8, padding: 16, flexBasis: 'auto', flexGrow: 1, flexShrink: 1}}>
            <Typography variant="h3">
                FE:3H Character Analyzer
            </Typography>
            <a href={RepositoryUrl} style={{display: 'block', float: 'right', marginTop: 18}}>
                <img src={GithubIcon} alt="Link to GitHub repository" style={{height: 16, width: 16}}/>
            </a>
            <div style={LinksTrayStyle}>
                <Link href={FaqUrl} underline="always"><HelpOutlineIcon fontSize="small" style={{...MenuIconStyle, marginLeft: 0}}/>FAQ</Link>
                <Link href={DocumentationUrl} underline="always"><MenuBookIcon fontSize="small" style={MenuIconStyle}/>Documentation</Link>
                <Link href={AboutDocsUrl} underline="always"><InfoIcon fontSize="small" style={MenuIconStyle}/>About</Link>
            </div>
        </Card>
    </div>;
}