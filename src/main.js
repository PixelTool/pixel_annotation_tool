/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
require("remodal");
require("noty");

var uuid = require('node-uuid');

require("./less/setting.less");


// 将模板附在页面上
var tplSetting = require("./tpl/setting.jade");
var tplNode = require("./tpl/pixel_node.jade");

// 全局对象
var PixelAnnotationTool = {};

PixelAnnotationTool.rule = null;
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
    }

});

$(document).keypress(function(event) {

    // 点击A呼出
    if (event.keyCode == 65 || event.keyCode == 97) {
        console.log("A Pressed");
        openSettingPanel();
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
