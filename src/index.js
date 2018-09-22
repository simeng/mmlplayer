import MML from 'mml';

window.onload = function () {
    var mml = new MML();
    document.querySelector("#play-mml").onclick = function () {
        var mmlData = document.querySelector("#mml-data");
        mml.parse(mmlData.value);
    };
};

