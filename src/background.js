/**
 * Created by rainx on 15/4/28.
 */

/* in background.html */
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log("injecting content script");
    chrome.tabs.executeScript(null,
        {file:"./build/main.js"});
});