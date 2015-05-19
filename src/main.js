/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
// configure remoal
require("remodal");
require("noty");
require("tooltipster");

var uuid                = require('node-uuid');
var cp                  = require("./libs/PixelCssPath.js");
var stringify           = require("json-stringify-pretty-compact");
var encodeHelper        = require("./libs/EncodeHelper");
var Pixel               = require("pixeljs");
var RuleStorage         = require("./libs/RuleStorage");
var ListNodes           = require("./libs/ListNodes");

require("./less/setting.less");
require("purecss");


// 将模板附在页面上
var tplSetting      = require("./tpl/setting.jade");
var tplConsole      = require("./tpl/console.jade");
var tplNode         = require("./tpl/pixel_node.jade");
var tplViewRule     = require("./tpl/view_rule.jade");
var tplHelp         = require("./tpl/help.jade");
var tplSampleData   = require("./tpl/sampledata.jade");
var tplSaveRule     = require("./tpl/save_rule.jade");
var tplLoadRule     = require("./tpl/load_rule.jade");
var tplLoadRuleTable = require("./tpl/load_rule_table.jade");
var tplLoadRuleTableTr = require("./tpl/load_rule_table_tr.jade");
var tplAddFilter    = require("./tpl/add_filter.jade");

// 全局对象
var PixelAnnotationTool = {};

PixelAnnotationTool.inspecting = false;
PixelAnnotationTool.lastInspectTarget = false;
PixelAnnotationTool.multiInspectingMode = false;
PixelAnnotationTool.inspectingStack = [];

PixelAnnotationTool.rule = null;
PixelAnnotationTool.shortcutOn = true;
PixelAnnotationTool.autosave = false;

PixelAnnotationTool.currentRuleRegex = null;

/*
DEMO Data

{
    "name" : "[root]",
    "type" : "{}",
    "def" : [
        {
            "name" : "name",
            "type" : "string"
        },
        {
            "name" : "tags",
            "type" : "[]",
            "def" : [
                {
                    "name" : "tag_name",
                    "type" : "string"
                }
            ]
        }
    ]
};

*/

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

// bootstrap
$(function() {

    console.log("starting");



    var notyStarting = noty({
        text : "---------------------- <br> 标注脚本已经启动，点击键盘'A'呼出标注菜单 <br>------------------------<br>",
        type : "infomation",
        layout: "center",
        timeout: 2000
    });

    if ($("[data-remodal-id=setting]").length == 0 ) {
        console.log("prepare appending to body")
        $(tplSetting()).appendTo("body");
        $(tplConsole()).appendTo("body");
        $(tplViewRule()).appendTo("body");
        $(tplHelp()).appendTo("body");
        $(tplSampleData()).appendTo("body");
        $(tplSaveRule()).appendTo("body");
        $(tplLoadRule()).appendTo("body");
        $(tplAddFilter()).appendTo("body");

        // activate tooltip
        $('.tooltip').tooltipster();
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
            console.log(allRegexRules);
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
            addUUIDAndLastForRule(PixelAnnotationTool.rule);
            updatePixelNodeList();
        }
    });


});

$(document).keypress(function(event) {

    if(!PixelAnnotationTool.shortcutOn) {
        return true;
    }

    // 点击A呼出
    if (event.keyCode == "q".charCodeAt(0) || event.keyCode == "Q".charCodeAt(0)) {
        stopInspect();
    } else if (event.keyCode == "v".charCodeAt(0) || event.keyCode == "V".charCodeAt(0)) {
        console.log(stringify(PixelAnnotationTool.rule));
    } else if (event.keyCode == "p".charCodeAt(0) || event.keyCode == "P".charCodeAt(0)) {
        selectParentNode();
    }

});

// 注册鼠标右键点击事件
function openSettingPanel()  {
    var settingDom =  $("[data-remodal-id=setting]");
    $("[data-remodal-id=setting]").remodal().open({
        closeOnAnyClick:false
    });
    tabSwitch();
}

function tabSwitch() {
    var settingDom =  $("[data-remodal-id=setting]");

    if (!PixelAnnotationTool.rule) {    // 当前的值为空
        console.log("is empty");
        settingDom.find(".tab").addClass("hide");
        settingDom.find(".tab-empty").removeClass("hide");
    } else { // 有数据的情况
        console.log("is tree");
        settingDom.find(".tab").addClass("hide");
        settingDom.find(".tab-tree").removeClass("hide");
        updateSettingByData();
    }
}


/******* Node 操作相关 start *******/
function updateSettingByData() {
    updatedStructrue();
    var contentDom = $("<ul/>");
    addUUIDAndLastForRule(PixelAnnotationTool.rule);
    showRule(PixelAnnotationTool.rule, 0);

    // 更新下面的select
    updatePixelNodeList();

    $(".tab-tree").empty();
    $(".tab-tree").append(contentDom);

    function showRule(rule, level) {

        if (rule == null) {
            return;
        }

        var nodeName = rule.name;
        var nodeType = rule.type;
        var nodeDef = rule.def;

        var li = $("<li />").appendTo(contentDom);

        var container = li;
        if (level > 0) {
            var counter = level;
            while(counter > 0) {
                counter--;
                container = $("<div class='pixel-node-next-level' />").appendTo(container);
            }
        }
        var nodeHtml = tplNode(rule);
        // console.log(nodeHtml);
        var nodeDom = $(nodeHtml);
        if (rule.last) {
            nodeDom.addClass("last");
        }

        if (rule.source && rule.source.selector) {
            nodeDom.find(".pixel-node-action-change-name").attr("title", rule.source.selector);
        }
        container.append(nodeDom);

        // 如果是对象或者数组，则继续获取下一级的内容
        if ((nodeType == '{}' || nodeType == "[]") && !!nodeDef) {
            for(var idx in nodeDef) {
                showRule(nodeDef[idx], level+1);
            }
        }

    }
}

// 遍历给node增加随机id
function addUUIDAndLastForRule(rule) {
    if (rule == null) {
        return ;
    }

    if (rule){

        if(!rule.uuid) {
            rule.uuid = uuid.v4();
        }

        if ((rule.type == "{}" || rule.type == "[]") && !!rule.def ) {
            for(var idx in rule.def) {

                if (!rule.def[idx]) {
                    continue;
                }

                addUUIDAndLastForRule(rule.def[idx]);

                if (idx == rule.def.length - 1) {
                    rule.def[idx].last = true;
                } else {
                    rule.def[idx].last = false;
                }
            }
        }
    }
}

// 根据uuid获取指定的node
function getNodeByUUID(rule, uuid) {
    if (rule && rule.uuid) {
        if (rule.uuid == uuid) {
            return rule;
        } else {

            if (rule.type == "{}" || rule.type == "[]") {
                for(var idx in rule.def) {
                    var cur = rule.def[idx];
                    var found = getNodeByUUID(cur, uuid);
                    if (found) {
                        return found;
                    }
                }
                return null;
            } else {
                return null;
            }
        }
    } else {
        return null;
    }
}

// 根据uuid移除节点，注意默认不移除当前节点
function removeNodeByUUID(rule, uuid) {
    if (rule == null) {
        return;
    }

    if (rule.type == "{}" || rule.type == "[]") {
        var toDeleteId = -1;
        for(var idx in rule.def) {
            var cur = rule.def[idx];

            if (!cur) {
                continue;
            }

            removeNodeByUUID(cur, uuid);
            if (cur.uuid == uuid) {
                toDeleteId = idx;
            }
        }
        if (toDeleteId > -1) {
            rule.def.splice(toDeleteId, 1);
        }
    }
}

// 点击创建新节点
$(document).on("click", ".pixel-node-add", function() {
    var uuid = $(this).attr("uuid");

    var node = getNodeByUUID(PixelAnnotationTool.rule, uuid);
    if (node) {
        if (!node.def) {
            node.def = [];
        }
        node.def.push({
            name : "unnamed",
            type : "string"
        });
        updateSettingByData();
    }

    return false;
});

// 点击删除当前节点
$(document).on("click", ".pixel-node-del", function() {
    var uuid = $(this).attr("uuid");

    var node = getNodeByUUID(PixelAnnotationTool.rule, uuid);
    if (node) {
        var ok = confirm("确认要删除该节点和它的所有子节点？");
        if (ok) {
            removeNodeByUUID(PixelAnnotationTool.rule, uuid);
            updateSettingByData();
        }
    }
    return false;
});

$(document).on("click", ".pixel-node-action-change-name", function() {
    var uuid = $(this).attr("uuid");

    var node = getNodeByUUID(PixelAnnotationTool.rule, uuid);

    if (node) {
        var newname = prompt("请输入新的节点名", node.name);
        if (newname) {
            node.name = newname;
            updateSettingByData();
        }
    }

    return false;
});

$(document).on("click", ".pixel-node-type", function() {
    var uuid = $(this).attr("uuid");
    var node = getNodeByUUID(PixelAnnotationTool.rule, uuid);
    if (node) {
        var newtype = prompt("请输入新的类型，目前仅支持 '{}', '[]', 'string' ", node.type);

        if (newtype && (newtype == '[]' || newtype == '{}' || newtype =='string')) {
            node.type = newtype;
            if (newtype == '[]' || newtype == '{}') {
                if (!node.def) {
                    node.def = [];
                }
            }
        } else {
            alert("目前还不支持你输入的类型");
        }
        updateSettingByData();
    }

    return false;
});

// 创建默认节点
$(document).on("click", ".action-create", function(e) {
    console.log(".action-create click");
    var newtype = prompt("请输入根节点的类型，目前仅支持 '{}', '[]'", "");
    if (newtype) {
        if (newtype == '{}' || newtype == '[]') {
            PixelAnnotationTool.rule = {
                name : "[root]",
                type : newtype,
                def : []
            };
            tabSwitch();
            updateSettingByData();
        } else {
            alert("输入错误");
        }
    }
    e.preventDefault();
    return false;
});
/******* Node 操作相关 end *******/


/****** console 相关 start ******/
// 点击打开设定菜单
$(document).on("click", ".pixel-open-tree", function() {
    openSettingPanel();
});

$(document).on("mousedown", ".pixel-console-action-inspect", function() {
    console.log(event.ctrlKey);
    cancelPixelActiveMask();
    PixelAnnotationTool.inspecting = true;
    $(this).text("Q to Quit");

    if (event.ctrlKey == 1 || event.metaKey) {
        console.log("Ctrl Key Pressed");
        PixelAnnotationTool.multiInspectingMode = true;
        PixelAnnotationTool.inspectingStack = [];
    } else {
        PixelAnnotationTool.multiInspectingMode = false;
    }
    console.log("start inspecting");
});

$(document).on("click", ".pixel-console-filter", function(){
    addFilter();
});

$(document).on("click", ".pixel-console-action-save", function() {
    saveSelector();
});

$(document).on("click", ".pixel-view-rule", function(){
    viewRule();
});

$(document).on("mouseover", ".pixel-download-rule", function(){
    genDownloadRule(this);
});

$(document).on("click", ".pixel-toggle-shortcut", function() {
    toggleShortcut();
});

$(document).on("click", ".pixel-help", function() {
    pixelHelp();
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

function updatePixelNodeList(rule, prefix){

    var $selectDom = $(".pixel-console-node");
    $selectDom.empty();

    $selectDom.append("<option value='-'>--请选择节点--</option>");

    _update(PixelAnnotationTool.rule, "");

    function _update(rule, prefix){
        if (rule && rule.uuid){
            $option = $("<option/>");
            $option.attr("value", rule.uuid);
            $option.text(rule.name + " {" + prefix + "-" + rule.name + "}");
            $selectDom.append($option);
            if ((rule.type == "{}" || rule.type == "[]") && !!rule.def ) {
                for(var idx in rule.def) {
                    _update(rule.def[idx], prefix + "-" + rule.name);
                }
            }
        }
    }
}

// 设定鼠标移动的动作
$(document).on("mousemove", function(e) {
    if (!PixelAnnotationTool.inspecting) {
        return;
    }

    var target = e.target;

    if (target == PixelAnnotationTool.lastInspectTarget) {
        return ;
    } else {
        $(PixelAnnotationTool.lastInspectTarget).removeClass("pixel-current-target-mask");
    }

    PixelAnnotationTool.lastInspectTarget = target;

    $(".pixel-console-selector").val(cp.cssPath(target, true));

    $(target).addClass("pixel-current-target-mask");

    //  设定selector
});

$(document).on("change", ".pixel-console-selector", function() {
    if (!PixelAnnotationTool.inspecting) {
        cancelPixelActiveMask();
        showPixelActiveMask();
    }
});


// 切换节点内容
$(document).on("change", ".pixel-console-node", function() {
    var uuid = $(this).val();

    if (uuid == "-") {
        return ;
    }

    var node = getNodeByUUID(PixelAnnotationTool.rule, uuid);
    if (node) {
        if(node.source) {
            if (node.source.selector != null) {
                $(".pixel-console-selector").val(node.source.selector);
            } else {
                $(".pixel-console-selector").val("");
            }

            if (node.source.method != null) {
                $(".pixel-console-method").val(node.source.method);
            } else {
                $(".pixel-console-method").val("text");
            }
        } else {
            $(".pixel-console-selector").val("");
            $(".pixel-console-method").val("text");
        }
    }
});

// 取消inspect

function stopInspect() {
    if (PixelAnnotationTool.multiInspectingMode == false) {
        PixelAnnotationTool.inspecting = false;
        $(".pixel-console-action-inspect").text("Inspect");
        $("*").removeClass("pixel-current-target-mask");
        PixelAnnotationTool.lastInspectTarget = null;
        showPixelActiveMask();
    } else {
        if (PixelAnnotationTool.inspectingStack.length == 0) {
            PixelAnnotationTool.inspectingStack.push($(".pixel-console-selector").val());
            $("*").removeClass("pixel-current-target-mask");
            PixelAnnotationTool.lastInspectTarget = null;
        } else {
            PixelAnnotationTool.inspecting = false;
            var last = PixelAnnotationTool.inspectingStack.pop();
            var cur = $(".pixel-console-selector").val();

            $("*").removeClass("pixel-current-target-mask");
            PixelAnnotationTool.lastInspectTarget = null;

            // caculate
            var multi = ListNodes.getListNodesSelector(last, cur);

            if (multi == false) {
                alert("Get Multi Node Failed");
                $(".pixel-console-selector").val("");
            } else {
                $(".pixel-console-selector").val(multi);
            }
            $(".pixel-console-action-inspect").text("Inspect");

            showPixelActiveMask();
        }
    }
}

// 选择父node 的 selector
function selectParentNode() {
    if (PixelAnnotationTool.inspecting == false) {
        return;
    }

    var newTarget = PixelAnnotationTool.lastInspectTarget.parentNode;

    if (newTarget == PixelAnnotationTool.lastInspectTarget ) {
        return;
    }
    $("*").removeClass("pixel-current-target-mask");
    $(".pixel-console-selector").val(cp.cssPath(newTarget, true));
    $(newTarget).addClass("pixel-current-target-mask");

    PixelAnnotationTool.lastInspectTarget = newTarget;
}

function addFilter() {
    var curDom = $(".pixel-console-node").val();
    var selector = $(".pixel-console-selector").val();
    var method = $(".pixel-console-method").val();

    if (curDom == "-") {
        alert("请选择正确的节点");
        return ;
    }

    var node = getNodeByUUID(PixelAnnotationTool.rule, curDom);

    var dom =  $("[data-remodal-id=add-filter]");
    dom.remodal().open({
        closeOnAnyClick:false
    });

    var inputFilter = dom.find("[name=pixel-filter]");

    if (node.filter) {
        inputFilter.val(node.filter);
    } else {
        inputFilter.val("");
    }

}

$(document).on("click", ".pixel-update-filter", function() {
    var curDom = $(".pixel-console-node").val();
    if (curDom == "-") {
        alert("请选择正确的节点");
        return ;
    }

    var node = getNodeByUUID(PixelAnnotationTool.rule, curDom);
    var dom =  $("[data-remodal-id=add-filter]");
    var inputFilter = dom.find("[name=pixel-filter]");

    var filter = $.trim(inputFilter.val());

    if (filter == "") {
        delete node["filter"];
        _suc()
        return false;
    } else {
        var ok = Pixel.validateRule(filter);
        if (ok) {
            node.filter = filter;
            _suc();
            return false;
        } else {
            alert("Not a validate filter");
            return false;
        }
    }

    function _suc() {
        noty({
            text : "更新成功" ,
            type : "success",
            layout: "center",
            timeout: 1000
        });
    }

    return false;
});


function saveSelector() {
    // 获取当前节点
    var curDom = $(".pixel-console-node").val();
    var selector = $(".pixel-console-selector").val();
    var method = $(".pixel-console-method").val();

    if (curDom == "-") {
        alert("请选择正确的节点");
        return ;
    }

    var source = {
        "selector"  :  selector,
        "method"    :  method
    };

    console.log(curDom);

    var node = getNodeByUUID(PixelAnnotationTool.rule, curDom);

    // console.log(node);

    if (node) {
        node.source = source;
    }

    updatedStructrue();

    noty({
        text : "保存成功，已将将 Selector {" + selector +"} 关联到标签 : " + node.name ,
        type : "success",
        layout: "center",
        timeout: 1000
    });

}


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
            noty({
                text : "保存成功",
                type : "success",
                layout: "center",
                timeout: 1000
            });
        });
    }

    console.log(name);
});

function saveTemplate() {

    var name = prompt("请输入要保存模板的名字", "");

    name = $.trim(name);

    if (name == "") {
        alert("模板名字不能为空");
        return;
    }

    if (PixelAnnotationTool.rule) {
        RuleStorage.updateRule(RuleStorage.TYPE_TEMPLATE, name, PixelAnnotationTool.rule, function() {
            noty({
                text : "保存模板成功",
                type : "success",
                layout: "center",
                timeout: 1000
            });
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
                    addUUIDAndLastForRule(PixelAnnotationTool.rule);
                    updatePixelNodeList();
                }

                noty({
                    text : "Load Rule Successful",
                    type : "infomation",
                    layout: "center",
                    timeout: 2000
                });
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
                noty({
                    text : "Delete Successful",
                    type : "infomation",
                    layout: "center",
                    timeout: 2000
                });
            });

            return false;
        }

        function viewAction() {
            noty({
                text : "Please View the rule Structure on Chrome DevTool Console",
                type : "infomation",
                layout: "center",
                timeout: 2000
            });
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

function toggleShortcut() {
    if (PixelAnnotationTool.shortcutOn) {
        PixelAnnotationTool.shortcutOn = false;
        noty({
            text : "Keyboard shortcut is OFF",
            type : "infomation",
            layout: "center",
            timeout: 2000
        });
    } else {
        PixelAnnotationTool.shortcutOn = true;
        noty({
            text : "Keyboard shortcut is ON",
            type : "infomation",
            layout: "center",
            timeout: 2000
        });
    }
}


function pixelHelp() {
    var dom =  $("[data-remodal-id=help]");
    dom.remodal().open({
        closeOnAnyClick:false
    });
}

function sampleData() {
    if (PixelAnnotationTool.rule == null) {
        alert("Rule is Empty, Please create one rule first!");
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

/****** console 相关 end ****/

/***
 对当前的selecor操作 start
 **/
function showPixelActiveMask()  {
    var selector = $(".pixel-console-selector").val();

    if (!selector || selector == "body") {
        return;
    }

    $(selector).addClass("pixel-current-target-active-mask");
}


function cancelPixelActiveMask() {
    $("*").removeClass("pixel-current-target-active-mask");
}

function updatedStructrue() {
    PixelAnnotationTool.autosave = false;
}

/***
 对当前的selecor操作 end
**/

/*** ***/
$(window).on("beforeunload", function() {
    if (PixelAnnotationTool.rule && !PixelAnnotationTool.autosave) {
        console.log("need to save before unload!");
        RuleStorage.updateRule(RuleStorage.TYPE_AUTOSAVE, window.location.href, PixelAnnotationTool.rule, function() {
            PixelAnnotationTool.autosave = true;
            console.log("saved!");
            window.close();
        });
    }
});
/*** ***/