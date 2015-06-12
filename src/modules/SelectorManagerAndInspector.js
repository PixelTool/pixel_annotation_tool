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
var jp                  = require("../libs/PixelJsonPath.js");
var Pixel               = require("pixeljs");
var PageFormatDetector  = require("../libs/PageFormatDetector");


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
            PixelAnnotationTool.inspectingJsonStack = [];
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
                    $(".pixel-console-selector").attr("cssPath", node.source.selector);
                    if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
                        $(".pixel-console-selector").val(node.source.jsonPath);
                    } else {
                        $(".pixel-console-selector").val(node.source.selector);
                    }
                } else {
                    $(".pixel-console-selector").val("");
                }

                if (node.source.method != null) {
                    $(".pixel-console-method").val(node.source.method);
                } else {
                    $(".pixel-console-method").val("text");
                }

                if (node.source.filter != null) {
                    $(".pixel-update-filter").attr("filter", node.source.filter);
                } else {
                    $(".pixel-update-filter").attr("filter", "");
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

                if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
                    PixelAnnotationTool.inspectingStack.push($(".pixel-console-selector").attr("cssPath"));
                    PixelAnnotationTool.inspectingJsonStack.push($(".pixel-console-selector").val());
                } else {
                    PixelAnnotationTool.inspectingStack.push($(".pixel-console-selector").val());
                }

                $("*").removeClass("pixel-current-target-mask");
                PixelAnnotationTool.lastInspectTarget = null;
            } else {
                PixelAnnotationTool.inspecting = false;
                var last = PixelAnnotationTool.inspectingStack.pop();
                var lastJson = PixelAnnotationTool.inspectingJsonStack.pop();
                var cur, curJson;
                if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
                    cur = $(".pixel-console-selector").attr("cssPath");
                    curJson = $(".pixel-console-selector").val();
                } else {
                    cur = $(".pixel-console-selector").val();
                }
                $("*").removeClass("pixel-current-target-mask");
                PixelAnnotationTool.lastInspectTarget = null;

                // caculate
                // console.log([last,cur]);
                var multi = ListNodes.getListNodesSelector(last, cur);

                if (multi == false) {
                    alert("Get Multi Node Failed");
                    $(".pixel-console-selector").val("");
                    $(".pixel-console-selector").attr("cssPath", "");
                } else {
                    if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
                        var multiJson = ListNodes.getJsonListNodesSelector(lastJson, curJson);
                        $(".pixel-console-selector").val(multiJson);
                        $(".pixel-console-selector").attr("cssPath", multi);
                    } else {
                        $(".pixel-console-selector").val(multi);
                        $(".pixel-console-selector").attr("cssPath", multi);
                    }

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

        if (node.source && node.source.filter) {
            inputFilter.val(node.source.filter);
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
            if (node.source) {
                delete node.source["filter"];
            }
            _suc()
            return false;
        } else {
            var ok = Pixel.validateRule(filter);
            if (ok) {
                $(".pixel-update-filter").attr("filter", filter);
                if (node.source) {
                    node.source.filter = filter;
                }
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
        var selector;
        if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
            selector =  $(".pixel-console-selector").attr("cssPath");
        } else {
            selector =  $(".pixel-console-selector").val();
        }

        var method = $(".pixel-console-method").val();

        if (curDom == "-") {
            alert("Please choose the right node");
            return ;
        }

        var filter = $(".pixel-update-filter").attr("filter");

        var source = {
            "selector"  :  selector,
            "method"    :  method
        };

        if (filter != null && filter != "") {
            source.filter = filter;
        }

        if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
            source['jsonPath'] = $(".pixel-console-selector").val();
        }

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

        if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
            if (!($(e.target).is(".property") || $(e.target).is("ul.array > li"))) {
                return;
            }
        }

        var target = e.target;

        if (target == PixelAnnotationTool.lastInspectTarget) {
            return;
        } else {
            $(PixelAnnotationTool.lastInspectTarget).removeClass("pixel-current-target-mask");
        }

        PixelAnnotationTool.lastInspectTarget = target;

        if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
            var data = jp.jsonPath(target, true);
            if (data) {
                $(".pixel-console-selector").val(data[0]);
                $(".pixel-console-selector").attr("cssPath", data[1]);
            }
        } else {
            var cssPath = cp.cssPath(target, true);
            $(".pixel-console-selector").val(cssPath);
            $(".pixel-console-selector").attr("cssPath", cssPath);
        }
        $(target).addClass("pixel-current-target-mask");

        //  设定selector
    });

    /***
     对当前的selecor操作 start
     **/
    function showPixelActiveMask()  {
        var selector = $(".pixel-console-selector").val();

        if (PixelAnnotationTool.pageFormat == PageFormatDetector.FORMAT_JSON) {
            selector = $(".pixel-console-selector").attr("cssPath");
        }

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