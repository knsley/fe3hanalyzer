/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export function clamp(value : number, lowerBound : number, upperBound : number) : number
{
    if (value < lowerBound)
    {
        return lowerBound;
    }
    else if (value > upperBound)
    {
        return upperBound;
    }
    else
    {
        return value;
    }
}
