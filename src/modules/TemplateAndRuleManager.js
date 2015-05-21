/**
 * Created by rainx on 15/5/21.
 */
require("jquery");
require("remodal");
var pixelAlert          = require("./NotyHelper").pixelAlert;
var pixelSuccess        = require("./NotyHelper").pixelSuccess;
var PixelNodeUtils      = require("../libs/PixelNodeUtils");
var RuleStorage         = require("../libs/RuleStorage");
var Pixel               = require("pixeljs");
var stringify           = require("json-stringify-pretty-compact");
var encodeHelper        = require("../libs/EncodeHelper");


var tplLoadRuleTable    = require("../tpl/load_rule_table.jade");
var tplLoadRuleTableTr  = require("../tpl/load_rule_table_tr.jade");

var TemplateAndRuleManager = function($, window, document, PixelAnnotationTool) {


    $(document).on("click", ".pixel-view-rule", function(){
        viewRule();
    });

    $(document).on("mouseover", ".pixel-download-rule", function(){
        genDownloadRule(this);
    });

    $(document).on("click", ".pixel-sample-data", function() {
        sampleData();
    });

    $(document).on("click", ".pixel-save-rule", function() {
        saveRule();
    });

    $(document).on("click", ".pixel-save-template", function() {
        saveTemplate();
    });

    $(document).on("click", ".pixel-load-rule", function() {
        loadRule();
    });

    function viewRule() {
        console.log("action view rule");
        var dom =  $("[data-remodal-id=view-rule]");
        dom.remodal().open({
            closeOnAnyClick:false
        });

        $(".view-rule-ta").text(stringify(PixelAnnotationTool.rule));
    }

    function genDownloadRule(obj) {
        $(obj).attr("href", "data:application/octet-stream;base64," + encodeHelper.base64Encode(stringify(PixelAnnotationTool.rule)));
    }

    function saveRule() {
        var hostname = window.location.hostname;
        var url = window.location.href;
        var dom =  $("[data-remodal-id=save-rule]");
        dom.remodal().open({
            closeOnAnyClick:false
        });

        if (PixelAnnotationTool.currentRuleRegex!= null) {
            $("[data-remodal-id=save-rule]").find("#rule-name").val(PixelAnnotationTool.currentRuleRegex.name);
            $("[data-remodal-id=save-rule]").find("#rule-regex").val(PixelAnnotationTool.currentRuleRegex.regex);
        }
    }

    $(document).on('confirm', '.remodal[data-remodal-id="save-rule"]', function () {
        var name = $.trim($(this).find("#rule-name").val());
        var regex = $.trim($(this).find("#rule-regex").val());

        if (name == "" ) {
            alert("name can not empty");
            return false;
        }

        if (regex == "" || !new RegExp(regex).test(window.location.href) ) {
            alert("Regular Expressions is not match this curl");
            return false;
        }

        if (PixelAnnotationTool.rule) {
            PixelAnnotationTool.rule.regex = regex;
            RuleStorage.updateRule(RuleStorage.TYPE_REGEX, name, PixelAnnotationTool.rule, function() {
                pixelSuccess("Save successfully");
            });
        }

        console.log(name);
    });

    function saveTemplate() {

        var name = prompt("Please input template name ", "");

        name = $.trim(name);

        if (name == "") {
            alert("Template name can not be null");
            return;
        }

        if (PixelAnnotationTool.rule) {
            RuleStorage.updateRule(RuleStorage.TYPE_TEMPLATE, name, PixelAnnotationTool.rule, function() {
                pixelSuccess("Template save successfully");
            });
        }

    }

    function loadRule() {
        console.log("hostname is " + window.location.hostname);
        RuleStorage.getAllRuleByDomain(window.location.hostname, function(rules) {
            var templates = rules[RuleStorage.TYPE_TEMPLATE];
            var regexRules = rules[RuleStorage.TYPE_REGEX];
            var autoSaveRules = rules[RuleStorage.TYPE_AUTOSAVE];

            console.log(regexRules);

            var dom =  $("[data-remodal-id=load-rule]");
            dom.remodal().open({
                closeOnAnyClick:false
            });

            if(templates == null || Object.keys(templates).length == 0) {
                dom.find(".emptyTemplates").show();
                dom.find(".templatesContent").hide();
            } else {
                dom.find(".emptyTemplates").hide();
                dom.find(".templatesContent").show();
                var container = dom.find(".templatesContent");
                container.empty();
                var table = $(tplLoadRuleTable());
                container.append(table);

                for (var key in templates) {

                    var attrs = {
                        "name": key,
                        "regex": "",
                        "type": RuleStorage.TYPE_TEMPLATE
                    };

                    table.append($(tplLoadRuleTableTr(attrs)));
                }

                $(table).on("click", "[action=load]", loadAction);
                $(table).on("click", "[action=delete]", deleteAction);
                $(table).on("click", "[action=view]", viewAction);
            }

            if (regexRules == null || Object.keys(regexRules.length) == 0) {
                dom.find(".emptyRegexRules").show();
                dom.find(".regexRulesContent").hide();
            } else {
                dom.find(".emptyRegexRules").hide();
                dom.find(".regexRulesContent").show();

                var container = dom.find(".regexRulesContent");
                container.empty();
                var table = $(tplLoadRuleTable());
                container.append(table);

                for (var key in regexRules) {

                    var attrs = {
                        "name": key,
                        "regex": regexRules[key].regex,
                        "type": RuleStorage.TYPE_REGEX
                    };

                    table.append($(tplLoadRuleTableTr(attrs)));
                }

                $(table).on("click", "[action=load]", loadAction);
                $(table).on("click", "[action=delete]", deleteAction);
                $(table).on("click", "[action=view]", viewAction);
            }

            if (autoSaveRules == null || Object.keys(autoSaveRules.length) == 0) {
                dom.find(".emptyAutoSaveRules").show();
                dom.find(".autoSaveRulesContent").hide();
            } else {
                dom.find(".emptyAutoSaveRules").hide();
                dom.find(".autoSaveRulesContent").show();
                var container = dom.find(".autoSaveRulesContent");
                container.empty();
                var table = $(tplLoadRuleTable());
                container.append(table);

                for (var key in autoSaveRules) {

                    var attrs = {
                        "name": key,
                        "regex": "",
                        "type": RuleStorage.TYPE_AUTOSAVE
                    };

                    table.append($(tplLoadRuleTableTr(attrs)));
                }

                $(table).on("click", "[action=load]", loadAction);
                $(table).on("click", "[action=delete]", deleteAction);
                $(table).on("click", "[action=view]", viewAction);
            }


            function loadAction() {
                var type = $(this).attr("type");
                var name = $(this).attr("key");
                var ok = confirm("Are you sure to load this rule to current context ? current rule will be replace ");
                if (!ok) {
                    return false;
                }

                if (rules[type] && rules[type][name]) {
                    var rule = rules[type][name];
                    PixelAnnotationTool.rule = rule;
                    if (PixelAnnotationTool.rule) {
                        PixelNodeUtils.addUUIDAndLastForRule(PixelAnnotationTool.rule);
                        PixelAnnotationTool.updatePixelNodeList();
                    }

                    pixelAlert("Load Rule Successful");
                }

                return false;
            }

            function deleteAction() {
                var type = $(this).attr("type");
                var name = $(this).attr("key");
                var tr = $(this).parents("tr");
                var ok = confirm("are you sure to delete this rule?");
                if (!ok) {
                    return false;
                }

                tr.remove();

                RuleStorage.deleteRuleByType(name, type, function() {
                    pixelAlert("Delete Successful");
                });

                return false;
            }

            function viewAction() {
                pixelAlert("Please View the rule Structure on Chrome DevTool Console");
                var type = $(this).attr("type");
                var name = $(this).attr("key");
                if (rules[type] && rules[type][name]) {
                    var rule = rules[type][name];
                    console.log(stringify(rule));
                }
                return false;
            }

        });


    }


    function sampleData() {
        if (PixelAnnotationTool.rule == null) {
            pixelAlert("Rule is Empty, Please create one rule first!");
            return;
        }

        var pixel = new Pixel();
        pixel
            .setup(JSON.stringify(PixelAnnotationTool.rule), window.location.href, $, null)
            .then(function(result) {
                var dom =  $("[data-remodal-id=sampledata]");
                dom.remodal().open({
                    closeOnAnyClick:false
                });

                $(".view-sample-data").text(stringify(result));
            }, function(e) {
                console.log("error" + e);
            });

    }

}


module.exports = TemplateAndRuleManager;
