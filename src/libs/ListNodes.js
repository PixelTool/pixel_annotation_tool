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

module.exports.getListNodesSelector = getListNodesSelector;