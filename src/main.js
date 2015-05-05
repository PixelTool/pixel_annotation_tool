/**
 * Created by rainx on 15/5/4.
 */
require("jquery");
require("remodal");
require("noty");

// require("./less/setting.less");

var A = {};


// 将模板附在页面上
var tplSetting = require("./tpl/setting.jade");

$(function() {
    if ($("[data-remodal-id=setting]").length == 0 ) {
        console.log("prepare appending to body")
        $(tplSetting()).appendTo("body");
    }
});

console.log("starting");
var notyStarting = noty({
        text : "---------------------- <br> 标注脚本已经启动，点击键盘'A'呼出标注菜单 <br>------------------------<br>",
        type : "infomation",
        layout: "center",
        timeout: 2000
});




$(document).keypress(function(event) {

    // 点击A呼出
    if (event.keyCode == 65 || event.keyCode == 97) {
        console.log("A Pressed");
        console.log( $("[data-remodal-id=setting]").length );
        $("[data-remodal-id=setting]").remodal().open();
    }

});


// 注册鼠标右键点击事件
