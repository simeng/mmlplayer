function MML() {
    var that = this;
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

    this.playNote = function(note, speed, mod) {
        MIDI.noteOn(that.track, note, that.volume, that.curPos);

        if (!mod.and)
            MIDI.noteOff(that.track, note, that.curPos + speed);
    };

    this.moveTime = function(speed) {
        var timeIndex = speed * (240 / this.tempo);
        that.curPos += timeIndex;
    };

    this.parseModifiers = function () {
        var value = "";
        var modifiers = { value: 0, halfStep: 0, stop: 0 };
        for (var i = that.index; i < this.source.length; i++){
            var cur = this.source[i];

            if (cur in this.charTypes 
                    && this.charTypes[cur] !== 'stop' 
                    && this.charTypes[cur] !== 'mod' 
                    && this.charTypes[cur] !== 'val') {
                that.index = i;
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
        that.index = i;
        return modifiers;
    };

    this.loadInstrument = function (name, callback) {
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

    this.parseNote = function() {
        while (that.index < this.source.length) {
            var i = that.index;
            var cur = this.source[i];

            if (this.charTypes[cur] === 'n') {
                // note
                that.index++;
                var mod = that.parseModifiers();
                var speed = 1 / that.defaultLength;
                if (mod.value)
                    speed = 1 / mod.value;
                if (mod.stop)
                    speed *= 1.5;

                that.speed = speed;
                that.note = that.octave * that.numNotes + that.notes[cur] + mod.halfStep;
                if (that.skipNext)
                    that.skipNext = false;
                else
                    that.playNote(that.note, that.speed, mod);

                that.moveTime(that.speed);

                if (mod.and)
                    that.skipNext = true;
            }
            else if (this.charTypes[cur] === 'trk') {
                that.index++;
                that.track++;
                that.curPos = this.startPos;
            }
            else if (this.charTypes[cur] === 'oct') {
                that.index++;
                // octave change command
                if (cur == '>') {
                    that.octave++;
                }
                else if (cur == '<') {
                    that.octave--;
                }
                else if (cur == 'o') {
                    var mod = that.parseModifiers();
                    that.octave = mod.value;
                }
            }
            else if (this.charTypes[cur] === 'len') {
                // length
                that.index++;
                var mod = that.parseModifiers();
                that.defaultLength = mod.value;
            }
            else if (this.charTypes[cur] === 'vol') {
                that.index++;
                var mod = that.parseModifiers();
                MIDI.setVolume(that.track, that.volume);
            }
            else if (this.charTypes[cur] === 'rest') {
                // rest
                that.index++;
                var mod = that.parseModifiers();
                var speed = 1 / that.defaultLength;
                if (mod.value) {
                    speed = 1 / mod.value;
                }
                that.moveTime(speed);
            }
            else if (this.charTypes[cur] === 'tempo') {
                // tempo
                that.index++;
                var mod = that.parseModifiers();
                that.tempo = mod.value;
            }
            else {
                console.log("Unhandled command: " + cur);
                that.index++;
            }
        }
    };

    this.parse = function(data) {
        that.source = data;
        that.curPos = that.startPos;
        that.index = 0;
        that.track = 0;

        that.reset();

        that.parseNote();
    };

    this.reset = function() {
        that.speed = 1/4;
        that.octave = 5;
        that.tempo = 100;
        that.defaultLength = 4;
    };
}


