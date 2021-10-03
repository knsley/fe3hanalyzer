/*
Copyright 2021 knsley
(https://github.com/knsley)

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import React from 'react';
import './App.css';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { CharacterName } from './data/CharacterName';
import { getDefaultStatModSetting, loadCharacterData } from './data/CharacterData';
import { getAppContext } from './model/AppContext';
import { CharacterProfile } from './model/CharacterProfile';
import { AnalysisPage } from './ui/AnalysisPage';
import { HeaderAndDocumentation } from './ui/HeaderAndDocumentation';
import { CharacterClass } from './data/CharacterClass';
import { loadClassData } from './data/ClassData';

interface AppProps
{

}

interface AppState
{
  profile : CharacterProfile;
  loaded : boolean;
}

function getInitialProfile() : CharacterProfile
{
  return {
    character : (0 as CharacterName),
    maxStatMods : getDefaultStatModSetting(),
    startLevel : 1,
    startClass : CharacterClass.Commoner,
    startStats : [0,0,0,0,0,0,0,0,0],
    changes : [],
    endLevel : 99,
  }
}

class App extends React.Component<AppProps, AppState> {

  constructor(props : AppProps)
  {
    super(props);
    this.state = {profile: getInitialProfile(), loaded : false};
  }

  componentDidMount() {
    loadCharacterData().then(() => {
      loadClassData().then(() => {
        const appContext = getAppContext();
        // test page #, more generally would expect to create a single page if no page, or load from store.
        if (!appContext.currentValue.pageManager.hasPage(0))
        {
          appContext.currentValue.pageManager.createNewPage(0);
        }

        this.setState({loaded: true});
      });
    });
  }

  render()
  {
    const theme = createMuiTheme({
      typography: {
      },
    });

    if (this.state.loaded)
    {
      const AppContextObject = getAppContext();
      const AppContext = AppContextObject.Context;

      return (
        <AppContext.Provider value={AppContextObject.currentValue}>
          <ThemeProvider theme={theme}>
            <div className="App">
              <HeaderAndDocumentation />
              <AnalysisPage pageId={0}/>
            </div>
          </ThemeProvider>
        </AppContext.Provider>
      );
    }
    else
    {
      return <div>Loading...</div>;
    }
  }
}

export default App;
