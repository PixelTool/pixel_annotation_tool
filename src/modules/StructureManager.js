/**
 * Created by rainx on 15/5/21.
 */
require("jquery");
require("remodal");
var pixelAlert          = require("./NotyHelper").pixelAlert;
var pixelSuccess        = require("./NotyHelper").pixelSuccess;
var tplNode             = require("../tpl/pixel_node.jade");

var PixelNodeUtils      = require("../libs/PixelNodeUtils");

module.exports = function($, window, document, PixelAnnotationTool) {


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

    // 点击打开设定菜单
    $(document).on("click", ".pixel-open-tree", function() {
        openSettingPanel();
    });

    // 创建默认节点
    $(document).on("click", ".action-create", function(e) {
        var newtype = prompt("Please input the root node type. currently support : '{}', '[]'", "");
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
                alert("Input error");
            }
        }
        e.preventDefault();
        return false;
    });

    /******* Node 操作相关 start *******/
    function updateSettingByData() {
        PixelAnnotationTool.autosave = false;
        var contentDom = $("<ul/>");
        PixelNodeUtils.addUUIDAndLastForRule(PixelAnnotationTool.rule);
        showRule(PixelAnnotationTool.rule, 0);

        // 更新下面的select
        PixelAnnotationTool.updatePixelNodeList();

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


    // 点击创建新节点
    $(document).on("click", ".pixel-node-add", function() {
        var uuid = $(this).attr("uuid");

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, uuid);
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

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, uuid);
        if (node) {
            var ok = confirm("确认要删除该节点和它的所有子节点？");
            if (ok) {
                PixelNodeUtils.removeNodeByUUID(PixelAnnotationTool.rule, uuid);
                updateSettingByData();
            }
        }
        return false;
    });

    $(document).on("click", ".pixel-node-action-change-name", function() {
        var uuid = $(this).attr("uuid");

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, uuid);

        if (node) {
            var newname = prompt("Please input the node name", node.name);
            if (newname) {
                node.name = newname;
                updateSettingByData();
            }
        }

        return false;
    });

    $(document).on("click", ".pixel-node-type", function() {
        var uuid = $(this).attr("uuid");
        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, uuid);
        if (node) {
            var newtype = prompt("Please input the type. currently support : '{}', '[]', 'string' ", node.type);

            if (newtype && (newtype == '[]' || newtype == '{}' || newtype =='string')) {
                node.type = newtype;
                if (newtype == '[]' || newtype == '{}') {
                    if (!node.def) {
                        node.def = [];
                    }
                }
            } else {
                pixelAlert("can not use this type");
            }
            updateSettingByData();
        }

        return false;
    });

    /******* Node 操作相关 end *******/
};