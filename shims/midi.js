/// Browser loader for mudcube/MIDI.js (https://github.com/mudcube/MIDI.js).
///
/// The UMD build (`node_modules/midi/build/MIDI.min.js`) is meant to run as a
/// classic <script> tag: it registers the global `MIDI` object via an
/// implicit top-level `var MIDI` (hoisted) and an implicit `galactic` global.
/// Bundlers like vite/rollup detect the node-only `module.exports` branch at
/// the end of the file and run it through their CommonJS interop, which
/// breaks that: the implicit globals get scoped to the module (the hoisted
/// `var MIDI` shadows the window global, so the whole library ends up built
/// in a scope that is thrown away) and the implicit `galactic` global throws
/// in strict mode.
///
/// So load the files as raw text and inject them as real classic scripts.
/// Inline dynamic scripts execute synchronously, so `window.MIDI` is fully
/// set up right after the append (the library's own soundfont loader relies
/// on exactly this behavior).
///
/// `inc/shim/Base64binary.js` must come first: the WebAudio plugin decodes
/// the base64 data-URI soundfont notes with `Base64Binary.decodeArrayBuffer`,
/// and the UMD build does not bundle that helper (the repo's own examples
/// load it as a separate script).
import base64binary from "midi/inc/shim/Base64binary.js?raw"
import midi from "midi/build/MIDI.min.js?raw"

for (const source of [base64binary, midi]) {
  const script = document.createElement("script")
  script.text = source
  document.head.appendChild(script)
}

export {}
