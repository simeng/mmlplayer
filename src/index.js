import MML from "mml";

window.onload = function() {
    const mml = new MML();
    let time = 0;
    console.log(mml);
    mml.onMoveTime(curPos => {
        time = curPos;
        console.log("time: ", time);
    });
    mml.onPlayNote((note, length, modifier) => {
        console.log("play: ", note, length, modifier);
    });
    mml.loadInstrument("acoustic_grand_piano", "soundfont/", function() {
        document.querySelector("#play-mml").onclick = function() {
            var mmlData = document.querySelector("#mml-data");
            mml.parse(mmlData.value);
        };
    });
};
