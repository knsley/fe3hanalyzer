/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export interface ColorScheme
{
    baseColor: string;
    baseHighlightColor: string;

    medianValueColor: string;
    medianValueHighlightColor: string;

    // If the user chooses to set a reference point for "how is my character doing?"
    referenceValueColor: string;
    referenceValueHighlightColor: string;
}

// Used for styling various data series.
export const SERIES_COLOR_SCHEMES: Array<ColorScheme> = [
    {
        baseColor: "#d34747",
        baseHighlightColor: "#f28282",
        medianValueColor: "#c11e1e",
        medianValueHighlightColor: "#f28282",
        referenceValueColor: "#a70303",
        referenceValueHighlightColor: "#c11e1e",
    },
    {
        baseColor: "#404094",
        baseHighlightColor: "#6666a8",
        medianValueColor: "#262687",
        medianValueHighlightColor: "#6666a8",
        referenceValueColor: "#131375",
        referenceValueHighlightColor: "#262687",
    },
    {
        baseColor: "#248924",
        baseHighlightColor: "#469b46",
        medianValueColor: "#0c780c",
        medianValueHighlightColor: "#469b46",
        referenceValueColor: "#006500",
        referenceValueHighlightColor: "#0c780c",
    }
];