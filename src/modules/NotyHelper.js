/**
 * Created by rainx on 15/5/21.
 */
require("noty");


function pixelAlert(word, timeout) {
    if (!timeout) {
        timeout = 2000;
    }

    return noty({
        text : word,
        type : "infomation",
        layout: "center",
        timeout: timeout
    });
}

function pixelSuccess(word, timeout) {
    if (!timeout) {
        timeout = 2000;
    }

    return noty({
        text : word,
        type : "success",
        layout: "center",
        timeout: timeout
    });
}

module.exports = {
    pixelAlert  : pixelAlert,
    pixelSuccess : pixelSuccess
}