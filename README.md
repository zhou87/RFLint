# RFLint

A tool to check style and conventions of Robot Framework.

## 环境

* 系统环境: Mac OS
* Node

## 安装

假设在您已经安装好node的情况下，可以直接使用如下命令安装到您的电脑上

```
npm install rflint -g
```

## 使用
在您的Robot Framework项目的根目录或者robot文件的上层目录下执行`rflint`即可。如果检查出您的robot文件有不符合规范的地方，将会友好的给您提示，正如下方展示：

```
🚀  Prelint...
👺  current dir: /Users/zhouhuiping/Documents/RFLint/rflint
⚙  Find a robot file: 首页.robot, start lint...
✅  Lint done! There is you report: 
[
    {
        "character": 0,
        "file": "/Users/zhouhuiping/Documents/npm_test/robot/首页.robot",
        "line": 5,
        "reason": "Settings里面没有Documentation,为了方便生成文档，建议加上Documentation",
        "severity": "Warning",
        "type": "Documentation"
    },
    {
        "character": 4,
        "file": "/Users/zhouhuiping/Documents/npm_test/robot/首页.robot",
        "line": 10,
        "reason": "FOR循环内关键字用反斜杠换行",
        "severity": "Error",
        "type": "For Loop"
    },
    {
        "character": 0,
        "file": "/Users/zhouhuiping/Documents/npm_test/robot/首页.robot",
        "line": 3,
        "reason": "Test Setup与前一个关键字之间应该有空行",
        "severity": "Warning",
        "type": "Line Space"
    },
    {
        "character": 20,
        "file": "/Users/zhouhuiping/Documents/npm_test/robot/首页.robot",
        "line": 12,
        "reason": "字符串定义和判断尽量用双引号",
        "severity": "Warning",
        "type": "Quote"
    }
]
```
为了能有高度的自定义能力，这里的报错和警告都已`json`数组的形式返回，方便自己处理和生成报表。


