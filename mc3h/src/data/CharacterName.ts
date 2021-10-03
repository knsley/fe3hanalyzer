/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export enum CharacterName
{
    BylethMale = 0,
    BylethFemale,
    
    // Black Eagles
    Edelgard,
    Hubert,
    Dorothea,
    Ferdinand,
    Bernadetta,
    Caspar,
    Petra,
    Linhardt,

    // Blue Lions
    Dimitri,
    Dedue,
    Felix,
    Mercedes,
    Ashe,
    Annette,
    Sylvain,
    Ingrid,

    // Golden Deer
    Claude,
    Lorenz,
    Hilda,
    Raphael,
    Lysithea,
    Ignatz,
    Marianne,
    Leonie,

    // Church
    Manuela,
    Hanneman,
    Seteth,
    Flayn,
    Cyril,
    Catherine,
    Alois,
    Gilbert,
    Shamir,

    // DLC
    Yuri,
    Balthus,
    Constance,
    Hapi,
    Jeritza,
    Anna,
    
    // For indexing
    End
}

// Byleth gets special handling because male/female Byleth
// have access to different classes.
function _ToCharacterDisplayName(c : CharacterName)
{
    switch(c)
    {
        case CharacterName.BylethFemale:
            return "Byleth (Female)";
        case CharacterName.BylethMale:
            return "Byleth (Male)";
        default:
            return CharacterName[c];
    }
}

// Precache the mapping.
const _enumToDisplay = new Map<CharacterName, string>();
const _displayToEnum = new Map<string, CharacterName>();
(() => {
    for (let i = 0; i < CharacterName.End.valueOf(); i++)
    {
        const enumValue : CharacterName = i as CharacterName;
        const stringValue = _ToCharacterDisplayName(enumValue);
        _enumToDisplay.set(enumValue, stringValue);
        _displayToEnum.set(stringValue, enumValue);
    }
})();

export function getCharacterDisplayName(c : CharacterName)
{
    const r = _enumToDisplay.get(c);
    
    if (r !== undefined)
    {
        return r;
    }
    else
    {
        throw new RangeError("Not a valid CharacterName enum value");
    }
}

export function getCharacterFromDisplayName(name : string)
{
    const r = _displayToEnum.get(name);
    
    if (r !== undefined)
    {
        return r;
    }
    else
    {
        throw new RangeError("Not a valid display name for a character.");
    }
}

export enum CharacterFaction
{
    Player = 0,
    BlackEagles,
    BlueLions,
    GoldenDeer,
    ChurchOfSeiros,
    AshenWolves,
    Other,
    End
};

const _factionNames = new Map<CharacterFaction,string>();
_factionNames.set(CharacterFaction.Player, "Player");
_factionNames.set(CharacterFaction.BlackEagles, "Black Eagles");
_factionNames.set(CharacterFaction.BlueLions, "Blue Lions");
_factionNames.set(CharacterFaction.GoldenDeer, "Golden Deer");
_factionNames.set(CharacterFaction.ChurchOfSeiros, "Church of Seiros");
_factionNames.set(CharacterFaction.AshenWolves, "Ashen Wolves");
_factionNames.set(CharacterFaction.Other, "Other");

export function getCharacterFactions() : Iterable<CharacterFaction>
{
    return _factionNames.keys();
}

export function getFactionDisplayName(faction : CharacterFaction) : string
{
    const displayName = _factionNames.get(faction);
    if (displayName === undefined)
    {
        throw new RangeError("faction value is not recognized as valid faction.");
    }
    else
    {
        return displayName;
    }
}

const listingOrderComparer = (a : CharacterName, b : CharacterName) => {
    // Just reuse explicit list order.
    return a - b;
};

const _byFaction = new Map<CharacterFaction,Array<CharacterName>>();
_byFaction.set(CharacterFaction.Player, [
    CharacterName.BylethMale,
    CharacterName.BylethFemale
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.BlackEagles, [
    CharacterName.Edelgard,
    CharacterName.Hubert,
    CharacterName.Dorothea,
    CharacterName.Ferdinand,
    CharacterName.Bernadetta,
    CharacterName.Caspar,
    CharacterName.Petra,
    CharacterName.Linhardt
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.BlueLions, [
    CharacterName.Dimitri,
    CharacterName.Dedue,
    CharacterName.Felix,
    CharacterName.Mercedes,
    CharacterName.Ashe,
    CharacterName.Annette,
    CharacterName.Sylvain,
    CharacterName.Ingrid,
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.GoldenDeer, [
    CharacterName.Claude,
    CharacterName.Lorenz,
    CharacterName.Hilda,
    CharacterName.Raphael,
    CharacterName.Lysithea,
    CharacterName.Ignatz,
    CharacterName.Marianne,
    CharacterName.Leonie,
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.ChurchOfSeiros, [
    CharacterName.Manuela,
    CharacterName.Hanneman,
    CharacterName.Seteth,
    CharacterName.Flayn,
    CharacterName.Cyril,
    CharacterName.Catherine,
    CharacterName.Alois,
    CharacterName.Gilbert,
    CharacterName.Shamir,
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.AshenWolves, [
    CharacterName.Yuri,
    CharacterName.Balthus,
    CharacterName.Constance,
    CharacterName.Hapi,
].sort(listingOrderComparer));
_byFaction.set(CharacterFaction.Other, [
    CharacterName.Jeritza,
    CharacterName.Anna
].sort(listingOrderComparer));

export function getCharactersByFaction(faction : CharacterFaction) : CharacterName[]
{
    const characters = _byFaction.get(faction);
    if (characters === undefined)
    {
        throw new RangeError(`No character mappings for faction ${CharacterFaction[faction]}`)
    }
    return characters;
}