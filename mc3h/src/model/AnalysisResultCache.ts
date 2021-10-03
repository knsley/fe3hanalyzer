/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { IStorageProvider } from "../storage/NestedStorageProvider";

export interface IAnalysisResultCache
{

}

// Mocked for now.
export function createAnalysisResultCache(rootStorageProvider : IStorageProvider) : IAnalysisResultCache
{
    return {};
}