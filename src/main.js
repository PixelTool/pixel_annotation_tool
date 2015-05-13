/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
require("remodal");
require("noty");
// var jsdom = require("jsdom");

var uuid                = require('node-uuid');
var cp                  = require("./libs/PixelCssPath.js");
var stringify           = require("json-stringify-pretty-compact");

var encodeHelper        = require("./libs/encode_helper");
var Pixel               = require("pixeljs");

require("./less/setting.less");
require("purecss");


// 将模板附在页面上
var tplSetting      = require("./tpl/setting.jade");
var tplConsole      = require("./tpl/console.jade");
var tplNode         = require("./tpl/pixel_node.jade");
var tplViewRule     = require("./tpl/view_rule.jade");
var tplHelp         = require("./tpl/help.jade");
var tplSampleData   = require("./tpl/sampledata.jade");

// 全局对象
var PixelAnnotationTool = {};

PixelAnnotationTool.inspecting = false;
PixelAnnotationTool.lastInspectTarget = false;


PixelAnnotationTool.rule = null;

PixelAnnotationTool.shortcutOn = true;



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
    }

    // restore from localStorage
    if (localStorage.PixelAnnotationToolRule) {
        PixelAnnotationTool.rule = JSON.parse(localStorage.PixelAnnotationToolRule);
        addUUIDAndLastForRule(PixelAnnotationTool.rule);
        updatePixelNodeList();
    }

});

$(document).keypress(function(event) {

    if(!PixelAnnotationTool.shortcutOn) {
        return true;
    }

    // 点击A呼出
    if (event.keyCode == "a".charCodeAt(0) || event.keyCode == "A".charCodeAt(0)) {
        console.log("Alt +  A Pressed");
        openSettingPanel();
    } else if (event.keyCode == "q".charCodeAt(0) || event.keyCode == "Q".charCodeAt(0)) {
        stopInspect();
    } else if (event.keyCode == "h".charCodeAt(0) || event.keyCode == "H".charCodeAt(0)) {
        console.log(PixelAnnotationTool);
    } else if (event.keyCode == "v".charCodeAt(0) || event.keyCode == "V".charCodeAt(0)) {
        console.log(stringify(PixelAnnotationTool.rule));
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
    var contentDom = $("<ul/>");
    addUUIDAndLastForRule(PixelAnnotationTool.rule);
    showRule(PixelAnnotationTool.rule, 0);

    // 更新下面的select
    updatePixelNodeList();

    $(".tab-tree").empty();
    $(".tab-tree").append(contentDom);

    function showRule(rule, level) {
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
        console.log(nodeHtml);
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
    if (rule){

        if(!rule.uuid) {
            rule.uuid = uuid.v4();
        }

        if ((rule.type == "{}" || rule.type == "[]") && !!rule.def ) {
            for(var idx in rule.def) {
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
    if (rule.type == "{}" || rule.type == "[]") {
        for(var idx in rule.def) {
            var cur = rule.def[idx];
            removeNodeByUUID(cur, uuid);
            if (cur.uuid == uuid) {
                delete rule.def[idx];
            }
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

$(document).on("click", ".pixel-console-action-inspect", function() {
    cancelPixelActiveMask();
    PixelAnnotationTool.inspecting = true;

    $(this).text("Q to Quit");

    console.log("start inspecting");
});

$(document).on("click", ".pixel-console-action-save", function() {
    saveSelector();
});

$(document).on("click", ".pixel-view-rule", function(){
    viewRule();
});

$(document).on("mouseover", ".pixel-save-rule", function(){
    genSaveRule(this);
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
    PixelAnnotationTool.inspecting = false;
    $(".pixel-console-action-inspect").text("Inspect");
    $("*").removeClass("pixel-current-target-mask");
    PixelAnnotationTool.lastInspectTarget = null;
    showPixelActiveMask();
}


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

    console.log(node);

    if (node) {
        node.source = source;
    }

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

function genSaveRule(obj) {
    $(obj).attr("href", "data:application/octet-stream;base64," + encodeHelper.base64Encode(stringify(PixelAnnotationTool.rule)));
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

/***
 对当前的selecor操作 end
**/

/*** ***/
$(window).unload(function() {
    if (PixelAnnotationTool.rule) {
        localStorage.PixelAnnotationToolRule = JSON.stringify(PixelAnnotationTool.rule);
    }
});
/*** ***/