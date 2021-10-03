/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { CharacterName } from "./CharacterName";

// Byleths
import BylethMale_Pre from '../images/bylethmale_1.png';
import BylethMale_Post from '../images/bylethmale_2.png';
import BylethFemale_Pre from '../images/bylethfemale_1.png';
import BylethFemale_Post from '../images/bylethfemale_2.png';

// Black Eagles
import Edelgard_Pre from '../images/edelgard_1.png';
import Edelgard_Post from '../images/edelgard_2.png';
import Hubert_Pre from '../images/hubert_1.png';
import Hubert_Post from '../images/hubert_2.png';
import Dorothea_Pre from '../images/dorothea_1.png';
import Dorothea_Post from '../images/dorothea_2.png';
import Ferdinand_Pre from '../images/ferdinand_1.png';
import Ferdinand_Post from '../images/ferdinand_2.png';
import Bernadetta_Pre from '../images/bernadetta_1.png';
import Bernadetta_Post from '../images/bernadetta_2.png';
import Caspar_Pre from '../images/caspar_1.png';
import Caspar_Post from '../images/caspar_2.png';
import Petra_Pre from '../images/petra_1.png';
import Petra_Post from '../images/petra_2.png';
import Linhardt_Pre from '../images/linhardt_1.png';
import Linhardt_Post from '../images/linhardt_2.png';


// Blue Lions
import Dimitri_Pre from '../images/dimitri_1.png';
import Dimitri_Post from '../images/dimitri_2.png';
import Dedue_Pre from '../images/dedue_1.png';
import Dedue_Post from '../images/dedue_2.png';
import Felix_Pre from '../images/felix_1.png';
import Felix_Post from '../images/felix_2.png';
import Mercedes_Pre from '../images/mercedes_1.png';
import Mercedes_Post from '../images/mercedes_2.png';
import Ashe_Pre from '../images/ashe_1.png';
import Ashe_Post from '../images/ashe_2.png';
import Annette_Pre from '../images/annette_1.png';
import Annette_Post from '../images/annette_2.png';
import Sylvain_Pre from '../images/sylvain_1.png';
import Sylvain_Post from '../images/sylvain_2.png';
import Ingrid_Pre from '../images/ingrid_1.png';
import Ingrid_Post from '../images/ingrid_2.png';

// Golden Deer
import Claude_Pre from '../images/claude_1.png';
import Claude_Post from '../images/claude_2.png';
import Lorenz_Pre from '../images/lorenz_1.png';
import Lorenz_Post from '../images/lorenz_2.png';
import Hilda_Pre from '../images/hilda_1.png';
import Hilda_Post from '../images/hilda_2.png';
import Raphael_Pre from '../images/raphael_1.png';
import Raphael_Post from '../images/raphael_2.png';
import Lysithea_Pre from '../images/lysithea_1.png';
import Lysithea_Post from '../images/lysithea_2.png';
import Ignatz_Pre from '../images/ignatz_1.png';
import Ignatz_Post from '../images/ignatz_2.png';
import Marianne_Pre from '../images/marianne_1.png';
import Marianne_Post from '../images/marianne_2.png';
import Leonie_Pre from '../images/leonie_1.png';
import Leonie_Post from '../images/leonie_2.png';

// Church
import Manuela from '../images/manuela_1.png';	
import Hanneman from '../images/hanneman_1.png';	
import Seteth from '../images/seteth_1.png';	
import Flayn from '../images/flayn_1.png';	
import Cyril_Pre from '../images/cyril_1.png';
import Cyril_Post from '../images/cyril_2.png';
import Catherine from '../images/catherine_1.png';	
import Alois from '../images/alois_1.png';	
import Gilbert from '../images/gilbert_1.png';	
import Shamir from '../images/shamir_1.png';	

// Ashen Wolves
import Yuri_Pre from '../images/yuri_1.png';
import Yuri_Post from '../images/yuri_2.png';
import Balthus_Pre from '../images/balthus_1.png';
import Balthus_Post from '../images/balthus_2.png';
import Constance_Pre from '../images/constance_1.png';
import Constance_Post from '../images/constance_2.png';
import Hapi_Pre from '../images/hapi_1.png';
import Hapi_Post from '../images/hapi_2.png';

// Other
import Jeritza from '../images/jeritza_1.png';
import Anna from '../images/anna_1.png';

export interface CharacterThumbnailProps
{
    character : CharacterName;
    // before/after timeskip?
    timeskip : boolean;
    width : number;
    height : number;
    style? : React.CSSProperties;
}

type ImgPath = string;

interface ThumbnailPaths
{
    preSkip : ImgPath;
    // Leave undefined if portrait doesn't chang after timeskip
    postSkip? : ImgPath;
}

export const CharacterToThumbnailMap = new Map<CharacterName, ThumbnailPaths>();

// Byleths
CharacterToThumbnailMap.set(CharacterName.BylethMale,   { preSkip: BylethMale_Pre,      postSkip: BylethMale_Post });
CharacterToThumbnailMap.set(CharacterName.BylethFemale, { preSkip: BylethFemale_Pre,    postSkip: BylethFemale_Post});

// Black Eagles
CharacterToThumbnailMap.set(CharacterName.Edelgard,     { preSkip: Edelgard_Pre,        postSkip: Edelgard_Post});
CharacterToThumbnailMap.set(CharacterName.Hubert,       { preSkip: Hubert_Pre,          postSkip: Hubert_Post});
CharacterToThumbnailMap.set(CharacterName.Dorothea,     { preSkip: Dorothea_Pre,        postSkip: Dorothea_Post});
CharacterToThumbnailMap.set(CharacterName.Ferdinand,    { preSkip: Ferdinand_Pre,       postSkip: Ferdinand_Post});
CharacterToThumbnailMap.set(CharacterName.Bernadetta,   { preSkip: Bernadetta_Pre,      postSkip: Bernadetta_Post});
CharacterToThumbnailMap.set(CharacterName.Caspar,       { preSkip: Caspar_Pre,          postSkip: Caspar_Post});
CharacterToThumbnailMap.set(CharacterName.Petra,        { preSkip: Petra_Pre,           postSkip: Petra_Post});
CharacterToThumbnailMap.set(CharacterName.Linhardt,     { preSkip: Linhardt_Pre,        postSkip: Linhardt_Post});

// Blue Lions
CharacterToThumbnailMap.set(CharacterName.Dimitri,      { preSkip: Dimitri_Pre,         postSkip: Dimitri_Post});
CharacterToThumbnailMap.set(CharacterName.Dedue,        { preSkip: Dedue_Pre,           postSkip: Dedue_Post});
CharacterToThumbnailMap.set(CharacterName.Felix,        { preSkip: Felix_Pre,           postSkip: Felix_Post});
CharacterToThumbnailMap.set(CharacterName.Mercedes,     { preSkip: Mercedes_Pre,        postSkip: Mercedes_Post});
CharacterToThumbnailMap.set(CharacterName.Ashe,         { preSkip: Ashe_Pre,            postSkip: Ashe_Post});
CharacterToThumbnailMap.set(CharacterName.Annette,      { preSkip: Annette_Pre,         postSkip: Annette_Post});
CharacterToThumbnailMap.set(CharacterName.Sylvain,      { preSkip: Sylvain_Pre,         postSkip: Sylvain_Post});
CharacterToThumbnailMap.set(CharacterName.Ingrid,       { preSkip: Ingrid_Pre,          postSkip: Ingrid_Post});

// Golden Deer
CharacterToThumbnailMap.set(CharacterName.Claude,       { preSkip: Claude_Pre,          postSkip: Claude_Post});
CharacterToThumbnailMap.set(CharacterName.Lorenz,       { preSkip: Lorenz_Pre,          postSkip: Lorenz_Post});
CharacterToThumbnailMap.set(CharacterName.Hilda,        { preSkip: Hilda_Pre,           postSkip: Hilda_Post});
CharacterToThumbnailMap.set(CharacterName.Raphael,      { preSkip: Raphael_Pre,         postSkip: Raphael_Post});
CharacterToThumbnailMap.set(CharacterName.Lysithea,     { preSkip: Lysithea_Pre,        postSkip: Lysithea_Post});
CharacterToThumbnailMap.set(CharacterName.Ignatz,       { preSkip: Ignatz_Pre,          postSkip: Ignatz_Post});
CharacterToThumbnailMap.set(CharacterName.Marianne,     { preSkip: Marianne_Pre,        postSkip: Marianne_Post});
CharacterToThumbnailMap.set(CharacterName.Leonie,       { preSkip: Leonie_Pre,          postSkip: Leonie_Post});

// Church
CharacterToThumbnailMap.set(CharacterName.Manuela,      { preSkip: Manuela});
CharacterToThumbnailMap.set(CharacterName.Hanneman,     { preSkip: Hanneman});
CharacterToThumbnailMap.set(CharacterName.Seteth,       { preSkip: Seteth});
CharacterToThumbnailMap.set(CharacterName.Flayn,        { preSkip: Flayn});
CharacterToThumbnailMap.set(CharacterName.Cyril,        { preSkip: Cyril_Pre,           postSkip: Cyril_Post});
CharacterToThumbnailMap.set(CharacterName.Catherine,    { preSkip: Catherine});
CharacterToThumbnailMap.set(CharacterName.Alois,        { preSkip: Alois});
CharacterToThumbnailMap.set(CharacterName.Gilbert,      { preSkip: Gilbert});
CharacterToThumbnailMap.set(CharacterName.Shamir,       { preSkip: Shamir});

// Ashen Wolves
CharacterToThumbnailMap.set(CharacterName.Yuri,         { preSkip: Yuri_Pre,            postSkip: Yuri_Post});
CharacterToThumbnailMap.set(CharacterName.Balthus,      { preSkip: Balthus_Pre,         postSkip: Balthus_Post});
CharacterToThumbnailMap.set(CharacterName.Constance,    { preSkip: Constance_Pre,       postSkip: Constance_Post});
CharacterToThumbnailMap.set(CharacterName.Hapi,         { preSkip: Hapi_Pre,            postSkip: Hapi_Post});

// Other
CharacterToThumbnailMap.set(CharacterName.Jeritza,      { preSkip: Jeritza});
CharacterToThumbnailMap.set(CharacterName.Anna,         { preSkip: Anna});
