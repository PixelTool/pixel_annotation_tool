/**
 * Created by rainx on 15/5/13.
 */

var rs = require("./libs/RuleStorage");

console.log("hi");
//rs.updateRule(rs.TYPE_TEMPLATE, "hello2", {"demo" : "hi"}, function(){ console.log("saved")});

var testRule = {
    "name": "[root]",
    "type": "{}",
    "def": [
        {
            "name": "title",
            "type": "string",
            "uuid": "9017ede5-711d-4ca2-a4b0-49c6dfc31a56",
            "last": false,
            "source": {
                "selector": "#home > div.container.row > div.main > div.content > div > article > section.single-post-header > header > h1",
                "method": "text"
            }
        },
        {
            "name": "author",
            "type": "string",
            "uuid": "1b2ab951-91e3-4ecb-b9fe-3ff8bfd5f71c",
            "last": false,
            "source": {
                "selector": "#home > div.container.row > div.main > div.content > div > article > section.single-post-header > header > div > a",
                "method": "text"
            }
        },
        {
            "name": "datetime",
            "type": "string",
            "uuid": "bfaa6e40-eaf0-4ccb-8bd0-81cda92657cb",
            "last": false,
            "source": {
                "selector": "#home > div.container.row > div.main > div.content > div > article > section.single-post-header > header > div > time",
                "method": "text"
            }
        },
        {
            "name": "content",
            "type": "string",
            "uuid": "d160eb61-885b-4b8c-a541-eae90fd650a5",
            "last": true,
            "source": {
                "selector": "#home > div.container.row > div.main > div.content > div > article > section.article",
                "method": "text"
            }
        }
    ],
    "uuid": "c2d17953-1279-451b-b53e-3d1889cce71f",
    "regex": "http://36kr.com/p/.*"
};


var resultRule = rs.deepCopyWithoutSources(testRule);

console.log(resultRule);