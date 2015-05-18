/**
 * Created by rainx on 15/5/13.
 */
/***
 *
 * Rule storage on chrome.storage
 *
 *
 * 3 type of rule
 *
 * 1 [[Template Rule]] Only has the basic structure, No source field.
 * 2 [[AutoSave]] AutoSave rule only match one single url.
 * 3 [[Regex]] Regex Rule match all urls pattern
 *
 * structrue
 * {
 *      "[[Template]]" : {
 *          "name1" : {...}
 *          "name2" : {...}
 *      },
 *      "github.com": {
 *          "[[AutoSave]]" : {
 *              "https://github.com/"                   : {...},
 *              "https://github.com/ipader/SwiftGuide"  : {...},
 *          },
 *          [[Regex]] : {
 *              "name1" : {
                    regex : "https://github.com/ipader/.*" // this append in the root of the rule structure
                    name : "[root]",
                    type : '{}',
                    def : .....
                    rule other path......

 *              }
 *          }
 *      },
 *      ....
 *
 * }
 *
 */

var RuleStorageConstant = {};
RuleStorageConstant.TYPE_TEMPLATE  = 0;
RuleStorageConstant.TYPE_AUTOSAVE  = 1;
RuleStorageConstant.TYPE_REGEX     = 2;

var RuleStorage =  (function() {

    var TYPE_TEMPLATE   = RuleStorageConstant.TYPE_TEMPLATE;
    var TYPE_AUTOSAVE   = RuleStorageConstant.TYPE_AUTOSAVE ;
    var TYPE_REGEX      = RuleStorageConstant.TYPE_REGEX ;

    var KEY_TEMPLATE    = "[[Template]]" ;
    var KEY_AUTOSAVE    = "[[AutoSave]]";
    var KEY_REGEX       = "[[Regex]]";


    return {
        /**
         *
         * @param type
         * @param name
         * @param rule in regex mode ,rule must contain a regex key
         * @param callback
         */
        updateRule : function(type, name, rule, callback) {
            var RuleStorageInstance = this;
            if (type == TYPE_TEMPLATE ) {
                chrome.storage.sync.get(
                    KEY_TEMPLATE, function(items) {

                        if (!items[KEY_TEMPLATE]) {
                            items[KEY_TEMPLATE] = "{}";
                        }

                        var arr = JSON.parse(items[KEY_TEMPLATE]);
                        var templateRule = RuleStorageInstance.deepCopyWithoutSources(rule);
                        arr[name] = templateRule;

                        items[KEY_TEMPLATE] = JSON.stringify(arr);

                        console.log(items);
                        chrome.storage.sync.set(
                            items, callback
                        );
                    }
                );
            } else {
                var domain = window.location.hostname || "unknown_domain";
                chrome.storage.sync.get(
                    domain, function(items) {
                        if (!items[domain]) {
                            items[domain] = "{}";
                        }
                        var obj = JSON.parse(items[domain]);
                        var typeStr = "";
                        if (type == TYPE_AUTOSAVE) {
                            typeStr = KEY_AUTOSAVE;
                        } else {
                            typeStr = KEY_REGEX;
                        }

                        if (!obj[typeStr]) {
                            obj[typeStr] = {};
                        }

                        var container = obj[typeStr];

                        container[name] = rule;

                        items[domain] = JSON.stringify(obj);

                        console.log(items);
                        chrome.storage.sync.set(
                            items, callback
                        );
                    }
                );
            }
        },

        /**
         *
         * @param domain
         * @param callback contains three value in array  TYPE_TEMPLATE ....
         */
        getAllRuleByDomain : function(domain, callback) {
            console.log([KEY_TEMPLATE, domain]);
            chrome.storage.sync.get(
                [KEY_TEMPLATE, domain],
                function(items) {
                    var parsedItems = {};

                    if(items[KEY_TEMPLATE]) {
                        var data = JSON.parse(items[KEY_TEMPLATE]);
                        parsedItems[TYPE_TEMPLATE] = data;
                    }

                    if (items[domain]) {
                        var data = JSON.parse(items[domain]);
                        parsedItems[TYPE_AUTOSAVE] = data[KEY_AUTOSAVE] || {};
                        parsedItems[TYPE_REGEX] = data[KEY_REGEX] || {};
                    } else {
                        parsedItems[TYPE_AUTOSAVE] = {};
                        parsedItems[TYPE_REGEX] = {};
                    }
                    // CALL CALLBACK
                    callback(parsedItems);
                }
            )
        },


        deleteRuleByType : function(name, type, callback) {
            var RuleStorageInstance = this;
            if (type == TYPE_TEMPLATE ) {
                chrome.storage.sync.get(
                    KEY_TEMPLATE, function(items) {

                        if (!items[KEY_TEMPLATE]) {
                            items[KEY_TEMPLATE] = "{}";
                        }

                        var arr = JSON.parse(items[KEY_TEMPLATE]);

                        delete arr[name];

                        items[KEY_TEMPLATE] = JSON.stringify(arr);

                        console.log(items);
                        chrome.storage.sync.set(
                            items, callback
                        );
                    }
                );
            } else {
                var domain = window.location.hostname || "unknown_domain";
                chrome.storage.sync.get(
                    domain, function(items) {
                        if (!items[domain]) {
                            items[domain] = "{}";
                        }
                        var obj = JSON.parse(items[domain]);
                        var typeStr = "";
                        if (type == TYPE_AUTOSAVE) {
                            typeStr = KEY_AUTOSAVE;
                        } else {
                            typeStr = KEY_REGEX;
                        }

                        if (!obj[typeStr]) {
                            obj[typeStr] = {};
                        }

                        var container = obj[typeStr];

                        delete container[name];

                        items[domain] = JSON.stringify(obj);

                        console.log(items);
                        chrome.storage.sync.set(
                            items, callback
                        );
                    }
                );
            }
        },

        deepCopyWithoutSources : function(obj) {

            // 遍历复制除了source内容之外的字段

            var result={},oClass=isClass(obj);
            if (oClass != "Array") {
                for(key in obj){

                    if (key == "source" || key == "regex") {
                        continue;
                    }

                    var copy=obj[key];
                    if(isClass(copy)=="Object"){
                        result[key]=arguments.callee(copy);
                    }else if(isClass(copy)=="Array"){
                        result[key]=arguments.callee(copy);
                    }else{
                        result[key]=obj[key];
                    }
                }
            } else {
                var result = [];
                for(key in obj){

                    var copy=obj[key];
                    if(isClass(copy)=="Object"){
                        result.push(arguments.callee(copy));
                    }else if(isClass(copy)=="Array"){
                        result.push(arguments.callee(copy));
                    }else{
                        result.push(obj[key]);
                    }
                }
            }
            return result;
        }
    };
})();

// one helper function
function isClass(o){
    if(o===null) return "Null";
    if(o===undefined) return "Undefined";
    return Object.prototype.toString.call(o).slice(8,-1);
}


RuleStorage.TYPE_TEMPLATE   = RuleStorageConstant.TYPE_TEMPLATE;
RuleStorage.TYPE_AUTOSAVE   = RuleStorageConstant.TYPE_AUTOSAVE ;
RuleStorage.TYPE_REGEX      = RuleStorageConstant.TYPE_REGEX ;

module.exports = RuleStorage;