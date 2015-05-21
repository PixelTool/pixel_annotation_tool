/**
 * Created by rainx on 15/5/21.
 */


var Help = function($, window, document, PixelAnnotationTool) {
    $(document).on("click", ".pixel-toggle-shortcut", function() {
        toggleShortcut();
    });

    $(document).on("click", ".pixel-help", function() {
        pixelHelp();
    });


    function pixelHelp() {
        var dom =  $("[data-remodal-id=help]");
        dom.remodal().open({
            closeOnAnyClick:false
        });
    }

    function toggleShortcut() {
        if (PixelAnnotationTool.shortcutOn) {
            PixelAnnotationTool.shortcutOn = false;
            pixelAlert("Keyboard shortcut is OFF");
        } else {
            PixelAnnotationTool.shortcutOn = true;
            pixelAlert("Keyboard shortcut is ON");
        }
    }
};


module.exports = Help;