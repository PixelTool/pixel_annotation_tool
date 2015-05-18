/**
 * Created by rainx on 15/5/11.
 */
function utf8_to_b64( str ) {
    return window.btoa(unescape(encodeURIComponent( str )));
}

function b64_to_utf8( str ) {
    return decodeURIComponent(escape(window.atob( str )));
}


module.exports = {
    base64Encode : utf8_to_b64,
    base64Decode : b64_to_utf8
};