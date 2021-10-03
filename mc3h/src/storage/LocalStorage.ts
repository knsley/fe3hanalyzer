/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterProfile } from "../model/CharacterProfile";
import { IStorageProvider } from "./NestedStorageProvider";

const CHARACTER_PROFILE_STORAGE_KEY = "CharacterProfiles";

export function getCustomStartProfiles(provider : IStorageProvider = window.localStorage) : Map<string,CharacterProfile>
{
    // Stub
    return new Map<string,CharacterProfile>();
}

export function saveCustomStartProfiles(profiles: Map<string,CharacterProfile>, provider : IStorageProvider = window.localStorage) : void
{
    // Stub
}

