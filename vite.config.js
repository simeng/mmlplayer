import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

/// the demo loads `soundfont/<instrument>-ogg.js` relative to index.html;
/// dev serves them straight from example/, the build must copy them over
const soundfontDir = fileURLToPath(new URL("./example/soundfont", import.meta.url))
const copySoundfont = {
  name: "copy-soundfont",
  apply: "build",
  closeBundle() {
    const to = fileURLToPath(new URL("./example/dist/soundfont", import.meta.url))
    if (!existsSync(soundfontDir)) return
    mkdirSync(to, { recursive: true })
    for (const f of readdirSync(soundfontDir)) {
      if (!f.startsWith(".")) copyFileSync(soundfontDir + "/" + f, to + "/" + f)
    }
  },
}

export default defineConfig({
  plugins: [copySoundfont],
  root: fileURLToPath(new URL("./example", import.meta.url)),
  resolve: {
    alias: [
      // bare "mml" import in the example -> library source (TS is handled by vite)
      {
        find: /^mml$/,
        replacement: fileURLToPath(new URL("./src/mml.ts", import.meta.url)),
      },
      // mudcube/MIDI.js is a UMD global build: evaluate it as a plain browser
      // script instead of letting the bundler mangle it (see shims/midi.js)
      {
        find: /^midi$/,
        replacement: fileURLToPath(new URL("./shims/midi.js", import.meta.url)),
      },
    ],
  },
  build: {
    // emits example/dist (built index.html + hashed assets + soundfont,
    // a self-contained demo)
    outDir: "dist",
  },
})
