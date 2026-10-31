/// mudcube/MIDI.js (https://github.com/mudcube/MIDI.js) ships a UMD build:
/// importing it executes the script and registers the global `MIDI` object.
import "midi"

declare global {
  // eslint-disable-next-line no-var
  var MIDI: any
}

type ModifierType = {
  value: number
  halfStep: number
  stop: number
  and?: boolean
}

type OnPlayNoteCb = (note: number, speed: number, mod: ModifierType) => void
type OnMoveTimeCb = (speed: number) => void

class MML {
  private onPlayNoteCb?: OnPlayNoteCb
  private onMoveTimeCb?: OnMoveTimeCb
  private note = 0
  private numNotes = 12
  private defaultLength = 4
  private index = 0
  private track = 0
  private startPos = 1
  private curPos = this.startPos
  private speed = 1 / 4
  private octave = 5
  private tempo = 100
  private volume = 127
  private source: string[] = []
  private skipNext = false

  private notes: { [key: string]: number } = {
    c: 0,
    d: 2,
    e: 4,
    f: 5,
    g: 7,
    a: 9,
    b: 11,
  }

  private charTypes: { [key: string]: string } = {
    c: "n",
    d: "n",
    e: "n",
    f: "n",
    g: "n",
    a: "n",
    b: "n",
    ".": "stop",
    ">": "oct",
    "<": "oct",
    o: "oct",
    "+": "mod",
    "-": "mod",
    "#": "mod",
    "&": "mod",
    t: "tempo",
    r: "rest",
    v: "vol",
    l: "len",
    ",": "trk",
    "1": "val",
    "2": "val",
    "3": "val",
    "4": "val",
    "5": "val",
    "6": "val",
    "7": "val",
    "8": "val",
    "9": "val",
    "0": "val",
  }

  playNote(note: number, speed: number, mod: ModifierType) {
    const context = MIDI.getContext()

    MIDI.noteOn(
      this.track,
      note,
      this.volume,
      context.currentTime + this.curPos
    )

    if (!mod.and)
      MIDI.noteOff(this.track, note, context.currentTime + this.curPos + speed)
    this.onPlayNoteCb && this.onPlayNoteCb(note, speed, mod)
  }

  moveTime(speed: number) {
    var timeIndex = speed * (240 / this.tempo)
    this.curPos += timeIndex

    this.onMoveTimeCb && this.onMoveTimeCb(this.curPos)
  }

  onMoveTime(cb: OnMoveTimeCb) {
    this.onMoveTimeCb = cb
  }

  onPlayNote(cb: OnPlayNoteCb) {
    this.onPlayNoteCb = cb
  }

  parseModifiers() {
    const modifiers: ModifierType = { value: 0, halfStep: 0, stop: 0 }
    for (var i = this.index; i < this.source.length; i++) {
      let cur = this.source[i]

      if (
        cur in this.charTypes &&
        this.charTypes[cur] !== "stop" &&
        this.charTypes[cur] !== "mod" &&
        this.charTypes[cur] !== "val"
      ) {
        this.index = i
        return modifiers
      }

      // Read in complete values if current is the start of one
      if (this.charTypes[cur] === "val") {
        var v = ""
        while (this.charTypes[this.source[i]] === "val") {
          v += this.source[i++]
        }
        i--
        modifiers.value = parseInt(v, 10)
      } else if (this.charTypes[cur] === "mod") {
        // ß, #
        if (cur === "+" || cur === "#") modifiers.halfStep = 1
        else if (cur === "&") modifiers.and = true
        else modifiers.halfStep = -1
      } else if (this.charTypes[cur] === "stop") {
        modifiers.stop = 1
      }
    }
    this.index = i
    return modifiers
  }

  loadInstrument(name: string, url: string, callback: () => void) {
    MIDI.loadPlugin({
      soundfontUrl: url,
      instrument: name,
      // soundfont playback needs the WebAudio plugin (the default selector
      // would pick WebMIDI when the browser offers it)
      api: "webaudio",
      onsuccess: function () {
        MIDI.programChange(0, MIDI.GM.byName[name].number)
        MIDI.programChange(1, MIDI.GM.byName[name].number)
        MIDI.programChange(2, MIDI.GM.byName[name].number)
        MIDI.programChange(3, MIDI.GM.byName[name].number)

        callback()
      },
    })
  }

  parseNote() {
    while (this.index < this.source.length) {
      var i = this.index
      var cur = this.source[i]

      if (this.charTypes[cur] === "n") {
        // note
        this.index++
        var mod = this.parseModifiers()
        var speed = 1 / this.defaultLength
        if (mod.value) speed = 1 / mod.value
        if (mod.stop) speed *= 1.5

        this.speed = speed
        this.note = this.octave * this.numNotes + this.notes[cur] + mod.halfStep
        if (this.skipNext) this.skipNext = false
        else this.playNote(this.note, this.speed, mod)

        this.moveTime(this.speed)

        if (mod.and) this.skipNext = true
      } else if (this.charTypes[cur] === "trk") {
        this.index++
        this.track++
        this.curPos = this.startPos
      } else if (this.charTypes[cur] === "oct") {
        this.index++
        // octave change command
        if (cur == ">") {
          this.octave++
        } else if (cur == "<") {
          this.octave--
        } else if (cur == "o") {
          var mod = this.parseModifiers()
          this.octave = mod.value
        }
      } else if (this.charTypes[cur] === "len") {
        // length
        this.index++
        var mod = this.parseModifiers()
        this.defaultLength = mod.value
      } else if (this.charTypes[cur] === "vol") {
        this.index++
        var mod = this.parseModifiers()
        MIDI.setVolume(this.track, this.volume)
      } else if (this.charTypes[cur] === "rest") {
        // rest
        this.index++
        var mod = this.parseModifiers()
        var speed = 1 / this.defaultLength
        if (mod.value) {
          speed = 1 / mod.value
        }
        this.moveTime(speed)
      } else if (this.charTypes[cur] === "tempo") {
        // tempo
        this.index++
        var mod = this.parseModifiers()
        this.tempo = mod.value
      } else {
        console.log("Unhandled command: " + cur)
        this.index++
      }
    }
  }

  parse(data: string[]) {
    this.source = data
    this.curPos = this.startPos
    this.index = 0
    this.track = 0

    this.reset()

    this.parseNote()
  }

  reset() {
    this.speed = 1 / 4
    this.octave = 5
    this.tempo = 100
    this.defaultLength = 4
  }
}

export default MML
