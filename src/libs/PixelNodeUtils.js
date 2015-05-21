/**
 * Created by rainx on 15/5/21.
 */

var uuid                = require('node-uuid');


var Utils = (function() {
    // 遍历给node增加随机id
    function addUUIDAndLastForRule(rule) {
        if (rule == null) {
            return ;
        }

        if (rule){

            if(!rule.uuid) {
                rule.uuid = uuid.v4();
            }

            if ((rule.type == "{}" || rule.type == "[]") && !!rule.def ) {
                for(var idx in rule.def) {

                    if (!rule.def[idx]) {
                        continue;
                    }

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
        if (rule == null) {
            return;
        }

        if (rule.type == "{}" || rule.type == "[]") {
            var toDeleteId = -1;
            for(var idx in rule.def) {
                var cur = rule.def[idx];

                if (!cur) {
                    continue;
                }

                removeNodeByUUID(cur, uuid);
                if (cur.uuid == uuid) {
                    toDeleteId = idx;
                }
            }
            if (toDeleteId > -1) {
                rule.def.splice(toDeleteId, 1);
            }
        }
    }

    return {
        addUUIDAndLastForRule   : addUUIDAndLastForRule,
        getNodeByUUID           : getNodeByUUID,
        removeNodeByUUID    : removeNodeByUUID
    };
})();




module.exports = Utils;