/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
require("remodal");
require("noty");

require("./less/setting.less");


// 将模板附在页面上
var tplSetting = require("./tpl/setting.jade");

// 全局对象
var PixelAnnotationTool = {};

PixelAnnotationTool.rule = null;

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

    $(document).on("click", ".action-create", function(e) {
        console.log(".action-create click");
        e.preventDefault();
        return false;
    });
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
    console.log( $("[data-remodal-id=setting]").length );
    var settingDom =  $("[data-remodal-id=setting]");
    $("[data-remodal-id=setting]").remodal().open();
    if (!PixelAnnotationTool.rule) {    // 当前的值为空
        settingDom.find(".tab").addClass("hide");
        settingDom.find(".tab-empty").removeClass("hide");
    } else { // 有数据的情况
        settingDom.find(".tab").addClass("hide");
        settingDom.find(".tab-tree").removeClass("hide");
        updateSettingByData();
    }
}

function updateSettingByData() {

}