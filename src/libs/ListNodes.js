/**
 * Created by rainx on 15/5/18.
 */

function getListNodesSelector (selA,selB) {
    var arrA = selA.split('>'),
        arrB = selB.split('>');
    var length = arrA.length > arrB.length ? arrA.length : arrB.length;

    var diffIndex = [];
    for (var i = 0; i < length; i++) {
        if (arrA[i] !== arrB[i]) {
            diffIndex.push(i);
        }
    }
    var pattern = /:nth\-child\(\d+\)/
    for (var i in diffIndex) {
        var index = diffIndex[i];
        arrA[index] = arrA[index].replace(pattern, '');
        arrB[index] = arrB[index].replace(pattern, '');
    }
    if (arrA.join('>') === arrB.join('>')) {
        return arrA.join('>');
    }
    return false;
}

function getJsonListNodesSelector (selA,selB) {
    var arrA = selA.split(/\[\d+\]/),
        arrB = selB.split(/\[\d+\]/);

    // hehe
    if (arrA.length != arrB.length) {
        return false;
    }

    var length = arrA.length > arrB.length ? arrA.length : arrB.length;

    var matchA = selA.match(/\[\d+\]/g);
    var matchB = selB.match(/\[\d+\]/g);

    var matchlength = matchA.length > matchB.length ? matchA.length : matchB.length;

    var diffIndex = [];
    for (var i = 0; i < length; i++) {
        console.log(arrA[i]);
        if (matchA[i] !== matchB[i]) {
            diffIndex.push(i);
        }
    }

    var jsonPath = "";
    for (var i = 0; i < arrA.length; i++) {
        jsonPath += arrA[i];
        if ($.inArray(i, diffIndex) == -1) {
            if (i < matchlength) {
                jsonPath += matchA[i];
            }
        } else {
            jsonPath += "[*]";
        }
    }
    return jsonPath;
}

module.exports.getListNodesSelector = getListNodesSelector;
module.exports.getJsonListNodesSelector = getJsonListNodesSelector;