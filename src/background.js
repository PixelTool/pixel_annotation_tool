/**
 * Created by rainx on 15/4/28.
 */

/* in background.html */
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log("injecting content script");
    // 注入代码，由于bootstrap比较大，所以暂时用inject的方式而不是commonjs的方式引入
    chrome.tabs.executeScript(null, {
        file:"./build/main.js"
    });
});