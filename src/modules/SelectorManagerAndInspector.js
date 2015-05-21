/**
 * Created by rainx on 15/5/21.
 */

require("jquery");
require("remodal");
var pixelAlert          = require("./NotyHelper").pixelAlert;
var pixelSuccess        = require("./NotyHelper").pixelSuccess;
var ListNodes           = require("../libs/ListNodes");
var PixelNodeUtils      = require("../libs/PixelNodeUtils");
var cp                  = require("../libs/PixelCssPath.js");
var Pixel               = require("pixeljs");


function SelectorManagerAndInspector($, window, document, PixelAnnotationTool) {

    PixelAnnotationTool.updatePixelNodeList = function(){

        var $selectDom = $(".pixel-console-node");
        $selectDom.empty();

        $selectDom.append("<option value='-'>--Select Node--</option>");

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

    $(document).on("mousedown", ".pixel-console-action-inspect", function() {
        cancelPixelActiveMask();
        PixelAnnotationTool.inspecting = true;
        $(this).text("Q to Quit");

        if (event.ctrlKey == 1 || event.metaKey) {
            console.log("Ctrl Key Pressed");
            PixelAnnotationTool.multiInspectingMode = true;
            PixelAnnotationTool.inspectingStack = [];
            pixelAlert("Start Inspecting , Press Q when you highlight the right element, You need select 2 similar element to get the selector for List");
        } else {
            PixelAnnotationTool.multiInspectingMode = false;
            pixelAlert("Start Inspecting , Press Q when you highlight the right element");
        }
        console.log("start inspecting");
    });

    $(document).on("click", ".pixel-console-filter", function(){
        addFilter();
    });

    $(document).on("click", ".pixel-console-action-save", function() {
        saveSelector();
    });


    // 切换节点内容
    $(document).on("change", ".pixel-console-node", function() {
        var uuid = $(this).val();

        if (uuid == "-") {
            return ;
        }

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, uuid);
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
                // console.log([last,cur]);
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
            alert("Please choose the right node");
            return ;
        }

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, curDom);

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
            alert("Please choose the right node");
            return ;
        }

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, curDom);
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
            pixelSuccess("Update successfuly");
        }

        return false;
    });


    function saveSelector() {
        // 获取当前节点
        var curDom = $(".pixel-console-node").val();
        var selector = $(".pixel-console-selector").val();
        var method = $(".pixel-console-method").val();

        if (curDom == "-") {
            alert("Please choose the right node");
            return ;
        }

        var source = {
            "selector"  :  selector,
            "method"    :  method
        };

        console.log(curDom);

        var node = PixelNodeUtils.getNodeByUUID(PixelAnnotationTool.rule, curDom);

        // console.log(node);

        if (node) {
            node.source = source;
        }

        PixelAnnotationTool.autosave = false;
        pixelSuccess( "Save Successfully ，Bind Selector {" + selector +"} To : " + node.name);
    }

    $(document).on("change", ".pixel-console-selector", function() {
        if (!PixelAnnotationTool.inspecting) {
            cancelPixelActiveMask();
            showPixelActiveMask();
        }
    });

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

    // export symbols to PixelAnnotationTool Context
    PixelAnnotationTool.stopInspect         = stopInspect;
    PixelAnnotationTool.selectParentNode    = selectParentNode;
}


module.exports = SelectorManagerAndInspector;