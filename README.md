# mmlplayer
Parses the MML music language used in games like Archeage and plays it through
MIDI.js

Demopage
========
http://dirty.h4x.no/mml/

Requirements
============
* https://github.com/mudcube/MIDI.js/ (installed as the `midi` dependency,
  pinned to the latest commit of the default `master` branch — the library is
  not published to npm, and `npm i mudcube/MIDI.js` would drop the `build/`
  directory because of the repo's own `.gitignore`, so a codeload tarball is
  used instead)
* https://github.com/mudcube/MIDI.js/blob/master/examples/soundfont (fetched
  via `npm run fetch-soundfont`)

Scripts
=======
* `npm run dev-example` - vite dev server for the demo page (`example/`)
* `npm run build-example` - fetch soundfont + build the demo to `example/dist/`
* `npm run watch-example` - like build-example, but keeps rebuilding on changes
* `npm run build-dist` - compile the library (`src/mml.ts`) to `dist/`
