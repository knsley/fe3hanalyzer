/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterClass } from "../data/CharacterClass";
import { StartingStats } from "./StatArray";

export interface ClassChange
{
    level: number;
    class: CharacterClass;
}

export interface GrowthProfile
{
    startLevel : number;
    startClass : CharacterClass;
    // Should be character's current stats, not base stats after subtracting bonus stats
    // from current class.
    startStats : StartingStats;

    changes : Array<ClassChange>;
    endLevel : number;
}

// Checks for correctness of the ClassProfile. Returns false if any class changes are 
// below initial class, also returns false if order of changes ever decreases in level.
export function validateClassProfile(c : GrowthProfile) : boolean
{
    if (c.startLevel > c.endLevel)
    {
        return false;
    }

    for (let i = 0; i < c.changes.length; i++)
    {
        if (c.changes[i].level < c.startLevel || c.changes[i].level > c.endLevel)
        {
            return false;
        }

        if (i > 0 && c.changes[i].level < c.changes[i-1].level)
        {
            return false;
        }
    }

    return true;
}
