/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
require("remodal");
require("tooltipster");


var RuleStorage         = require("./libs/RuleStorage");
var PixelNodeUtils      = require("./libs/PixelNodeUtils");
var PageFormatDetector  = require("./libs/PageFormatDetector");
var pixelAlert          = require("./modules/NotyHelper").pixelAlert;

require("./less/setting.less");
require("purecss");


// 将模板附在页面上
var tplSetting      = require("./tpl/setting.jade");
var tplConsole      = require("./tpl/console.jade");
var tplViewRule     = require("./tpl/view_rule.jade");
var tplHelp         = require("./tpl/help.jade");
var tplSampleData   = require("./tpl/sampledata.jade");
var tplSaveRule     = require("./tpl/save_rule.jade");
var tplLoadRule     = require("./tpl/load_rule.jade");
var tplAddFilter    = require("./tpl/add_filter.jade");

// 全局对象
var PixelAnnotationTool = {};

PixelAnnotationTool.inspecting = false;
PixelAnnotationTool.lastInspectTarget = false;
PixelAnnotationTool.multiInspectingMode = false;
PixelAnnotationTool.inspectingStack = [];
PixelAnnotationTool.inspectingJsonStack = [];

PixelAnnotationTool.rule = null;
PixelAnnotationTool.shortcutOn = true;
PixelAnnotationTool.autosave = false;

PixelAnnotationTool.currentRuleRegex = null;
PixelAnnotationTool.pageFormat = null;


// Load Modules
require("./modules/StructureManager")($, window, document, PixelAnnotationTool);
require("./modules/SelectorManagerAndInspector")($, window, document, PixelAnnotationTool);
require("./modules/TemplateAndRuleManager")($, window, document, PixelAnnotationTool);
require("./modules/Help")($, window, document, PixelAnnotationTool);

// auto save every 10 sec
var autoSaveTimer = setInterval(function() {
    if (PixelAnnotationTool.rule && !PixelAnnotationTool.autosave) {
        console.log("prepare autosave");
        RuleStorage.updateRule(RuleStorage.TYPE_AUTOSAVE, window.location.href, PixelAnnotationTool.rule,
        function() {
            console.log("autosaved!");
            PixelAnnotationTool.autosave = true;
        });
    }
}, 10000);

var detect = PageFormatDetector.detect();

PixelAnnotationTool.pageFormat = detect.format;

if (detect.format == PageFormatDetector.FORMAT_JSON) {
    console.log("is json format");
}

// bootstrap
$(function() {

    console.log("starting");

    pixelAlert("---------------------- <br> Pixel Annotation Tool <br>------------------------<br>");

    if ($("[data-remodal-id=setting]").length == 0 ) {
        $(tplSetting()).appendTo("body");
        $(tplConsole()).appendTo("body");
        $(tplViewRule()).appendTo("body");
        $(tplHelp()).appendTo("body");
        $(tplSampleData()).appendTo("body");
        $(tplSaveRule()).appendTo("body");
        $(tplLoadRule()).appendTo("body");
        $(tplAddFilter()).appendTo("body");

        // activate tooltip
        $('.pixel-tooltip').tooltipster();
    }

    // restore from storage
    RuleStorage.getAllRuleByDomain(window.location.hostname, function(rules) {
        // 先尝试从 autosave 恢复
        if (rules[RuleStorage.TYPE_AUTOSAVE]
            && rules[RuleStorage.TYPE_AUTOSAVE][window.location.href]
            && rules[RuleStorage.TYPE_AUTOSAVE][window.location.href]['name']) {
            PixelAnnotationTool.rule = rules[RuleStorage.TYPE_AUTOSAVE][window.location.href];
        } else {
            // 然后尝试从 regex 规则回复
            var allRegexRules = rules[RuleStorage.TYPE_REGEX];
            for(var key in allRegexRules) {
                var rule = allRegexRules[key];

                if (rule
                    && rule.regex
                    && new RegExp(rule.regex).test(window.location.href)) {
                    PixelAnnotationTool.rule = rule;
                    PixelAnnotationTool.currentRuleRegex = {
                        "name": key,
                        "regex": rule.regex
                    };
                }
            }
        }

        if (PixelAnnotationTool.rule) {
            PixelNodeUtils.addUUIDAndLastForRule(PixelAnnotationTool.rule);
            PixelAnnotationTool.updatePixelNodeList();
        }
    });


});

$(document).keypress(function(event) {

    if(!PixelAnnotationTool.shortcutOn) {
        return true;
    }

    // 点击A呼出
    if (event.keyCode == "q".charCodeAt(0) || event.keyCode == "Q".charCodeAt(0)) {
        PixelAnnotationTool.stopInspect();
    } else if (event.keyCode == "v".charCodeAt(0) || event.keyCode == "V".charCodeAt(0)) {
        console.log(stringify(PixelAnnotationTool.rule));
    } else if (event.keyCode == "p".charCodeAt(0) || event.keyCode == "P".charCodeAt(0) || event.keyCode == ">".charCodeAt(0)) {
        PixelAnnotationTool.selectParentNode();
    }

});

/*** ***/
$(window).on("beforeunload", function() {
    if (PixelAnnotationTool.rule && !PixelAnnotationTool.autosave) {
        RuleStorage.updateRule(RuleStorage.TYPE_AUTOSAVE, window.location.href, PixelAnnotationTool.rule, function() {
            PixelAnnotationTool.autosave = true;
            console.log("auto saved!");
            window.close();
        });
    }
});
/*** ***/