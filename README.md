Pixel annotation_tool
===============

#### 模板结构


- name 属性

    节点的名字, 根节点用[root]名字

- type 属性

    'string' - 字符串
    '{}' - 对象类型
    '[]' - 数组类型

- def 属性

    对于 {} 和 [] 这种结构化的数据，还需要定义 def 属性定义所有子节点的类型和名称，依次递归

- source
    - method
        - 'text'
        - 'html'
        - '[attr]'
    - selector : css 选择器
    - filter :  过滤器

如:


```
{
    'name' : '[root]',
    'type' : '{}'
    'def'  : [
        {
            name : 'name',
            type : 'string',
            source: {
                selector : '.word .detail',
                method   : 'text'
                filter   : ''
            }
        },
        {
            name : 'summary',
            type : 'string'
        },
        {
            name : 'headlines'
            type : '[]',
            source : { // 可以为空，默认不限定
                selector : '#detail_content'
            }
            def  : [
                {
                    name : 'title',
                    type : 'string',

                    source : {
                        selector : '#content_left h3',
                        method : 'text'
                    }
                },
                {
                    name : 'abstract',
                    type : 'string',
                    source : {
                        selector: '#content_left .c-abstract',
                        method : 'text'
                    }
                },
                {
                    name : 'link',
                    type : 'string',
                    source : {
                        selector: '#content_left h3',
                        method: '[href]'
                    }
                }
            ]
        }
    ]
}
```

#### Parser

Node module : PixelParser/index.js

```
module.exports = {
    parse
}
```

[jQuery_dom] content

    浏览器jQuery ->$(window.document)
    nod_jquery  ->  $(html_content)
    xhr -> $(html_content)


```
[string] PixelParser.parse([string] rule, [jQuery_dom] content, [string] url);
[Promise] PixelParser.fetchAndParse([string] rule, [string] url, [callback] cb);
```