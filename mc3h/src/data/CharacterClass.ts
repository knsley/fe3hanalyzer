/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export enum CharacterClass
{
    // Unique/start of game classes
    Commoner = 0,
    Noble,
    Dancer,

    // Tactician only
    EnlightenedOne,

    // House leaders only in pt. 2
    ArmoredLord,
    HighLord,
    WyvernMaster,
    Emperor,
    GreatLord,
    Barbarossa,

    // Beginner classes
    Myrmidon,
    Soldier,
    Fighter,
    Monk,

    // Intermediate
    Lord,
    Mercenary,
    Thief,
    ArmoredKnight,
    Cavalier,
    Brigand,
    Archer,
    Brawler,
    Mage,
    DarkMage,
    Priest,
    PegasusKnight,

    // Advanced
    Hero,
    Swordmaster,
    Assassin,
    FortressKnight,
    Paladin,
    WyvernRider,
    Warrior,
    Sniper,
    Grappler,
    Warlock,
    DarkBishop,
    Bishop,

    // Master
    FalconKnight,
    WyvernLord,
    MortalSavant,
    GreatKnight,
    BowKnight,
    DarkKnight,
    HolyKnight,
    WarMaster,
    Gremory,

    // Cindered Shadows
    Trickster,
    WarMonk,
    WarCleric,
    DarkFlier,
    Valkyrie,
    DeathKnight,

    // Trailing number for indexing
    End
}

// Generate lookups for names and shit.
const ClassNameToEnum : Map<string, CharacterClass> = new Map<string, CharacterClass>();
const ClassEnumToName : Map<CharacterClass, string> = new Map<CharacterClass, string>();
(function() {
    const iterEnd = CharacterClass.End.valueOf();
    for (let i = 0; i < iterEnd; i++)
    {
        let friendlyName = CharacterClass[i].replace(/\B[A-Z]/g, " $&");
        ClassNameToEnum.set(friendlyName, i);
        ClassEnumToName.set(i, friendlyName);
    }
})();

export function getClassDisplayName(c : CharacterClass) : string
{
    const result = ClassEnumToName.get(c);
    if (result === undefined)
    {
        throw new RangeError("Not a valid CharacterClass enum value.");
    }
    else
    {
        return result;
    }
}

export function getClassFromDisplayName(c : string) : CharacterClass
{
    const result = ClassNameToEnum.get(c);
    if (result === undefined)
    {
        throw new RangeError("Not a valid class name, no matching enum found.");
    }
    else
    {
        return result;
    }
}

export function getStartingClasses() : Set<CharacterClass>
{
    return new Set([CharacterClass.Commoner, CharacterClass.Noble]);
}

export enum CharacterClassGroup
{
    Unique = 0,
    Beginner,
    Intermediate,
    Advanced,
    Special,
    Master,
    Player,
    HouseLeader,
    Other,
    End
}

export function getCharacterClassGroupDisplayName(c : CharacterClassGroup) : string
{
    if (c === CharacterClassGroup.HouseLeader)
    {
        return "House Leader";
    }
    else if (c >= 0 || c < CharacterClassGroup.End)
    {
        return CharacterClassGroup[c];
    }
    else
    {
        throw new RangeError("Not recognized character class group");
    }
}

const _byCategory = new Map<CharacterClassGroup,Array<CharacterClass>>();
_byCategory.set(CharacterClassGroup.Unique, [
    CharacterClass.Commoner,
    CharacterClass.Noble,
    CharacterClass.Dancer,
]);
_byCategory.set(CharacterClassGroup.Beginner, [
    CharacterClass.Myrmidon,
    CharacterClass.Soldier,
    CharacterClass.Fighter,
    CharacterClass.Monk,
]);
_byCategory.set(CharacterClassGroup.Intermediate, [
    CharacterClass.Lord,
    CharacterClass.Mercenary,
    CharacterClass.Thief,
    CharacterClass.ArmoredKnight,
    CharacterClass.Cavalier,
    CharacterClass.Brigand,
    CharacterClass.Archer,
    CharacterClass.Brawler,
    CharacterClass.Mage,
    CharacterClass.DarkMage,
    CharacterClass.Priest,
    CharacterClass.PegasusKnight,
]);
_byCategory.set(CharacterClassGroup.Advanced, [
    CharacterClass.Hero,
    CharacterClass.Swordmaster,
    CharacterClass.Assassin,
    CharacterClass.FortressKnight,
    CharacterClass.Paladin,
    CharacterClass.WyvernRider,
    CharacterClass.Warrior,
    CharacterClass.Sniper,
    CharacterClass.Grappler,
    CharacterClass.Warlock,
    CharacterClass.DarkBishop,
    CharacterClass.Bishop,
]);
_byCategory.set(CharacterClassGroup.Special, [
    CharacterClass.Trickster,
    CharacterClass.WarMonk,
    CharacterClass.WarCleric,
    CharacterClass.DarkFlier,
    CharacterClass.Valkyrie,
]);
_byCategory.set(CharacterClassGroup.Master, [
    CharacterClass.FalconKnight,
    CharacterClass.WyvernLord,
    CharacterClass.MortalSavant,
    CharacterClass.GreatKnight,
    CharacterClass.BowKnight,
    CharacterClass.DarkKnight,
    CharacterClass.HolyKnight,
    CharacterClass.WarMaster,
    CharacterClass.Gremory,
]);
_byCategory.set(CharacterClassGroup.Player, [
    CharacterClass.EnlightenedOne,
]);
_byCategory.set(CharacterClassGroup.HouseLeader, [
    CharacterClass.ArmoredLord,
    CharacterClass.HighLord,
    CharacterClass.WyvernMaster,
    CharacterClass.Emperor,
    CharacterClass.GreatLord,
    CharacterClass.Barbarossa,
]);
_byCategory.set(CharacterClassGroup.Other, [
    CharacterClass.DeathKnight,
]);

export function getCharacterClassCategories() : Iterable<CharacterClassGroup>
{
    return _byCategory.keys();
}

export function getCharacterClassesByCategory(category : CharacterClassGroup) : CharacterClass[]
{
    const classList = _byCategory.get(category);
    if (classList === undefined)
    {
        throw new RangeError(`No class list found for category ${CharacterClassGroup[category]}`);
    }
    return classList;
}