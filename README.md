Pixel Annotation_Tool
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


#### Filter (Ref by Angular JS Filter System)

参考AngularJS的Filter实现方式， filter 之间可以使用 | 管道进行叠加 如：

```
filter1 | filter2
```

就是应用完filter1 之后再应用filter2

filter 可以跟参数，

```
filter1:argument1:argument2
````

* date filter (日期filter)
```
{{ 1304375948024 | date }}
{{ 1304375948024 | date:"MM/dd/yyyy @ h:mma" }}
```

* json filter
```
{{ {foo: "bar", baz: 23} | json }}
```

* lowercase Format a string to lower case.
* uppercase Format a string to upper case.
* substring 等同于javascript 的 String.substring方法
* substr 等同于javascript String.substr方法
* split 等同于 javascript 的String.split方法, 返回数组格式
* replace 等同于javascript的 stringObject.replace(regexp/substr,replacement) 可以使用正则表达式
* match 等于于javascript的 stringObject.match(regexp) 返回匹配到的内容
