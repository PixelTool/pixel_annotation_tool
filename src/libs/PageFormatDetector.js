/**
 * Created by rainx on 15/5/21.
 */

function extractJSONData(rawText) {
    var tokens, text = rawText.trim();

    function test(text) {
        return ((text.charAt(0) == "[" && text.charAt(text.length - 1) == "]") || (text.charAt(0) == "{" && text.charAt(text.length - 1) == "}"));
    }

    if (test(text))
        return {
            text : rawText,
            offset : 0
        };
    tokens = text.match(/^([^\s\(]*)\s*\(([\s\S]*)\)\s*;?$/);
    if (tokens && tokens[1] && tokens[2]) {
        if (test(tokens[2].trim()))
            return {
                fnName : tokens[1],
                text : tokens[2],
                offset : rawText.indexOf(tokens[2])
            };
    }
}


var PageFormatDetector = (function() {

    return {
        detect : function() {
            var format = PageFormatDetector.FORMAT_HTML;
            var document = window.document;
            var child, data;
            if (document.body && (document.body.childNodes[0] && document.body.childNodes[0].tagName == "PRE" || document.body.children.length == 0)) {
                child = document.body.children.length ? document.body.childNodes[0] : document.body;

                // 如果已经包含了JSONView插件，则还原其JSON数据

                data = extractJSONData(child.innerText);
                if (data) {
                    format = PageFormatDetector.FORMAT_JSON;
                } else {
                    format = PageFormatDetector.FORMAT_HTML;
                }
            } else {

                if ($("body > div#json").size() == 1 && $("body > div.toolbox").size() == 1) {
                    // maybe jsonview
                    console.log("size :" + $("body > div#json").size());
                    // 展开所有内容，并取出json数据
                    $(".hoverable").not(".collapsed").click();
                    var jsondata = $("body > #json").text();
                    data = extractJSONData(jsondata);
                    if (data) {
                        format = PageFormatDetector.FORMAT_JSON;
                    } else {
                        format =  PageFormatDetector.FORMAT_HTML;
                    }
                }

                if (format == PageFormatDetector.FORMAT_JSON) {
                    return {
                        format : format,
                        data : data
                    };
                } else {
                    return {
                        format : format
                    };
                }
            }
        }
    };

})();

PageFormatDetector.FORMAT_HTML = 0;
PageFormatDetector.FORMAT_JSON = 1;
PageFormatDetector.FORMAT_OTHER = 2;

module.exports = PageFormatDetector;



