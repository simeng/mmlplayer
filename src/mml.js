import MIDI from 'midi.js';

class MML {
    constructor() {
        this.delay = 0; // play one note every quarter second
        this.note = 0; // the MIDI note
        this.numNotes = 12;
        this.defaultLength = 4;
        this.index = 0;
        this.value = "";
        this.track = 0;
        this.startPos = 1;
        this.curPos = this.startPos;
        this.speed = 1/4;
        this.octave = 5;
        this.tempo = 100;
        this.volume = 127;
        this.source = null;
        this.skipNext = false;
        this.notes = {
            c: 0,
            d: 2,
            e: 4,
            f: 5,
            g: 7,
            a: 9,
            b: 11
        };
        this.charTypes = {
            'c': 'n',
            'd': 'n',
            'e': 'n',
            'f': 'n',
            'g': 'n',
            'a': 'n',
            'b': 'n',
            '.': 'stop',
            '>': 'oct',
            '<': 'oct',
            'o': 'oct',
            '+': 'mod',
            '-': 'mod',
            '#': 'mod',
            '&': 'mod',
            't': 'tempo',
            'r': 'rest',
            'v': 'vol',
            'l': 'len',
            ',': 'trk',
            '1': 'val',
            '2': 'val',
            '3': 'val',
            '4': 'val',
            '5': 'val',
            '6': 'val',
            '7': 'val',
            '8': 'val',
            '9': 'val',
            '0': 'val'
        };
        console.log("Loading");
        MIDI.loadPlugin({
            instrument: "acoustic_grand_piano",
            onprogress: (state, progress) => {
                console.log(state, progress);
            },
            onsuccess: () => {
                console.log("Loaded");
            }
        });
    }

    playNote(note, speed, mod) {
        MIDI.noteOn(this.track, note, this.volume, this.curPos);

        if (!mod.and)
            MIDI.noteOff(this.track, note, this.curPos + speed);
    };

    moveTime(speed) {
        var timeIndex = speed * (240 / this.tempo);
        this.curPos += timeIndex;
    };

    parseModifiers() {
        var value = "";
        var modifiers = { value: 0, halfStep: 0, stop: 0 };
        for (var i = this.index; i < this.source.length; i++){
            var cur = this.source[i];

            if (cur in this.charTypes 
                    && this.charTypes[cur] !== 'stop' 
                    && this.charTypes[cur] !== 'mod' 
                    && this.charTypes[cur] !== 'val') {
                this.index = i;
                return modifiers;
            }

            // Read in complete values if current is the start of one
            if (this.charTypes[cur] === 'val') {
                var v = "";
                while (this.charTypes[this.source[i]] === 'val') {
                    v += this.source[i++];
                }
                i--;
                modifiers.value = parseInt(v, 10);
            }
            else if (this.charTypes[cur] === 'mod') {
                // ß, #
                if (cur === '+' || cur === '#')
                    modifiers.halfStep = 1;
                else if (cur === '&')
                    modifiers.and = true;
                else
                    modifiers.halfStep = -1;
            }
            else if (this.charTypes[cur] === 'stop') {
                modifiers.stop = 1;
            }
        }
        this.index = i;
        return modifiers;
    };

    loadInstrument(name, callback) {
        MIDI.loadPlugin({
            soundfontUrl: "midi-js-soundfonts/FluidR3_GM/",
            instrument: name,
            onsuccess: function() {
                MIDI.programChange(0, MIDI.GM.byName[name].number);
                MIDI.programChange(1, MIDI.GM.byName[name].number);
                MIDI.programChange(2, MIDI.GM.byName[name].number);
                MIDI.programChange(3, MIDI.GM.byName[name].number);

                callback();
            }
        });
    };

    parseNote() {
        while (this.index < this.source.length) {
            var i = this.index;
            var cur = this.source[i];

            if (this.charTypes[cur] === 'n') {
                // note
                this.index++;
                var mod = this.parseModifiers();
                var speed = 1 / this.defaultLength;
                if (mod.value)
                    speed = 1 / mod.value;
                if (mod.stop)
                    speed *= 1.5;

                this.speed = speed;
                this.note = this.octave * this.numNotes + this.notes[cur] + mod.halfStep;
                if (this.skipNext)
                    this.skipNext = false;
                else
                    this.playNote(this.note, this.speed, mod);

                this.moveTime(this.speed);

                if (mod.and)
                    this.skipNext = true;
            }
            else if (this.charTypes[cur] === 'trk') {
                this.index++;
                this.track++;
                this.curPos = this.startPos;
            }
            else if (this.charTypes[cur] === 'oct') {
                this.index++;
                // octave change command
                if (cur == '>') {
                    this.octave++;
                }
                else if (cur == '<') {
                    this.octave--;
                }
                else if (cur == 'o') {
                    var mod = this.parseModifiers();
                    this.octave = mod.value;
                }
            }
            else if (this.charTypes[cur] === 'len') {
                // length
                this.index++;
                var mod = this.parseModifiers();
                this.defaultLength = mod.value;
            }
            else if (this.charTypes[cur] === 'vol') {
                this.index++;
                var mod = this.parseModifiers();
                MIDI.setVolume(this.track, this.volume);
            }
            else if (this.charTypes[cur] === 'rest') {
                // rest
                this.index++;
                var mod = this.parseModifiers();
                var speed = 1 / this.defaultLength;
                if (mod.value) {
                    speed = 1 / mod.value;
                }
                this.moveTime(speed);
            }
            else if (this.charTypes[cur] === 'tempo') {
                // tempo
                this.index++;
                var mod = this.parseModifiers();
                this.tempo = mod.value;
            }
            else {
                console.log("Unhandled command: " + cur);
                this.index++;
            }
        }
    };

    parse(data) {
        this.source = data;
        this.curPos = this.startPos;
        this.index = 0;
        this.track = 0;

        this.reset();

        this.parseNote();
    };

    reset() {
        this.speed = 1/4;
        this.octave = 5;
        this.tempo = 100;
        this.defaultLength = 4;
    };
}

export default MML;
