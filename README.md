# Fire Emblem Three Houses Character Analyzer

## Copyright License

The source code is licensed under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).

For licenses of assets and libraries used by this project, see [Sources](#sources) below.

### Why MPL 2.0?

The Mozilla Public License 2.0 requires continued sharing of this project's source code, to make sure that the Fire Emblem community benefits from further work based on this project.

## Building for Yourself

From the "mc3h" folder (not the repo root), run:

    yarn build

Build outputs go to the `/mc3h/build` directory.

## Dev Server

From the "mc3h" folder (not the repo root), run:

    yarn start

## Unit Tests

From the "mc3h" folder (not the repo root), run:

	yarn test

## Why is the Code a Travesty of Coding Best Practices?

It's a "learning project" that covered ~1 year of stuff. I probably went through several different coding styles and paradigms.

This project was never intended to be a great example of well-written code. It's getting dragged over the finish line kicking and screaming,
with just enough testing to make sure the actual math is accurate.

## Sources

### Data

Character and class data transcribed from *Serenes Forest*: https://serenesforest.net/three-houses/

Some class data and most character presets transcribed from *Fire Emblem Wiki* at: https://fireemblemwiki.org/

Character thumbnails from *3H portraits* at: https://three-houses-portraits.tumblr.com/

Written discussion about the mechanics of the "RNG protection" feature affecting stat growths: 

* https://forums.serenesforest.net/index.php?/topic/91108-a-deep-dive-into-level-up-mechanics/
* https://gamefaqs.gamespot.com/switch/204445-fire-emblem-three-houses/answers/550524-is-it-possible-to-increase-no-stat-after-a-level-up

### Code

This project uses the following code libraries and their dependencies:

* TypeScript (https://www.typescriptlang.org/) - [Apache License 2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt)
* Create React App (https://create-react-app.dev/) - [MIT License](https://github.com/facebook/create-react-app/blob/main/LICENSE)
* Webpack (https://webpack.js.org/) - [MIT License](https://github.com/webpack/webpack/blob/main/LICENSE)
* React.js (https://reactjs.org/) - [MIT License](https://github.com/facebook/react/blob/main/LICENSE)
* Material UI (https://mui.com/) - [MIT License](https://github.com/mui-org/material-ui/blob/master/LICENSE)
* Recharts (https://recharts.org/) - [MIT License](https://github.com/recharts/recharts/blob/master/LICENSE)
* jest (https://jestjs.io/) - [MIT License](https://github.com/facebook/jest/blob/main/LICENSE)
* yarn (https://yarnpkg.com/) - [BSD 2-Clause License](https://github.com/yarnpkg/berry/blob/master/LICENSE.md)
* Node.js (https://nodejs.org/) - [License](https://github.com/nodejs/nodejs.org/blob/main/LICENSE)
* Papa Parse (https://www.papaparse.com/) - [MIT License](https://github.com/mholt/PapaParse/blob/master/LICENSE)
* react-beautiful-dnd (https://github.com/atlassian/react-beautiful-dnd) - [Apache License 2.0](https://github.com/atlassian/react-beautiful-dnd/blob/master/LICENSE)
* seedrandom.js (https://www.npmjs.com/package/seedrandom) - [MIT License](https://github.com/davidbau/seedrandom/blob/released/README.md)
