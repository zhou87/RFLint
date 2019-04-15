#!/usr/bin/env  node

const Path = require('path')
const fs = require('fs')
const glob = require('glob')
const readlineSync = require('../readline-sync')
require('colors')
const Parser = require('./parser')
var consoleJson = new Array()
const sourceDir = Path.resolve(__dirname,'../')
const [node, path, ...argv] = process.argv

// 检测文件
searchFiles()

/// 查找robot文件
function searchFiles() {
    var sourceFiles = argv
    if (sourceFiles.length>0) {
        sourceFiles.forEach(file=> {
            fileName = file.slice(0,file.length-1)
            if (sourceFiles.length == 1) {
                fileName = fileName.slice(1,fileName.length)
            }
            console.log(fileName)
            /// 判断文件是.robot后缀
            if (endWith(fileName, '.robot')) {
                let sourcefolder = Path.resolve(__dirname,'../../..')
                let sourceFile = sourcefolder + '/' + fileName;
                console.log('Linting ' + '\'' + sourceFile + '\'')
                lintFile(sourceFile)
            }
        })
    } else {
        glob('**/*.robot',function (error,files) {
            if (files.length==0) {
                console.log(`'No lintable files found at path \'${process.cwd()}\''`.red)
            } else {
                console.log('Linting robot files in current working directory')
                files.forEach(function (file) {
                    console.log('Linting ' + '\'' + file + '\'')
                    lintFile(file)
                })
            }
        })
    }
}

/// 对文件进行lint检测
function lintFile(file) {

    let parser = new Parser();
    parser.parserFile(file);
    console.log(parser.tables);

    /// 检测是否有Documentation"
    fileHasDocumentation(file,parser.tables)

    /// 不重名
    noSameName(file,parser.tables)

    /// for循环内关键字是否有反斜杠标识
    checkForLoop(file,parser.tables)

    /// if语句下面是否是"..."开头
    checkIf(file, parser.tables)

    /// resource和Test SetUp之间应该空一行
    checkResourceAndTestSetUp(file, parser.tables)

    /// keyWords和TestCase尽量不要共存
    keywordShouldNotContainTestCase(file, parser.tables);

    /// 字符串判断引号和单引号成对出现
    compareStringNeedSingleQuote(file,parser.tables)

    /// 字符串定义和比较使用双引号，单引号报警告、
    stringUseDoubleQuoteSigleQuoteWarning(file, parser.tables)

    /// 打印json信息
    console.log(consoleJson);

}

/// 检测是否写了Documentation
function fileHasDocumentation(file,tables) {
    if (!fs.existsSync(file)) {
        console.log('文件不存在!')
        return 
    }
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        var isHasDocumentation = false;
        if (table.name == 'Settings') {
            for (let j = 0; j < table.rows.length; j++) {
                let row = table.rows[j];
                /// 有documentation
                if (row.cells.length > 0) {
                    if (row.cells[0].text == 'Documentation') {
                        /// 只有'Documentation'关键字，没有补全信息
                        isHasDocumentation = true;
                        if (row.cells.length < 2) {
                            let outputInfo = constructOutPutJson(row.cells[0].lineNumber,sourceDir + '/' +file,table.rows[j].lineNumber,'Settings里面有Documentation,但并没有补全文件信息', 'Warning', 'Documentation')
                            consoleJson.push(outputInfo);
                        }
                    }
                } 
                if (!isHasDocumentation && (j == table.rows.length -1)) {
                    /// 如果没有,构建违规信息
                    let outputInfo = constructOutPutJson(null,sourceDir + '/' +file,null,'Settings里面没有Documentation,为了方便生成文档，建议加上Documentation','Warning','Documentation')
                    consoleJson.push(outputInfo);
                }
            }
        }
    }
}

/// 去掉字符串空格
function trim(str) {
    if (String(str).length === 0 || str === undefined) {
        return ''
    }
    return str.replace(/\s|\xA0/g,"");    
}

/// Variable、Keywords、TestCase文件内不能重名
function noSameName(file,tables) {
    /// 存放keyWords、testCase、Variable的row数组
    var keywordsList = new Array();
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        /// settings不检查
        if (table.name != 'Settings') {
            for (let j = 0; j < table.rows.length; j++) {
                var row = table.rows[j];
                let cells = row.cells;
                /// 如果是关键字 加入数组
                if (cells.length > 0) {
                    let firstCell = cells[0];
                    // console.log('<========>' + firstCell.text + '///' + firstCell.lineNumber)
                    /// 如果是顶格写的并且不以'...'、'#'开头的cell,则判定为一个Variable/Keywords/TestCase
                    if ((firstCell.lineNumber == 0) && (String(firstCell.text)[0] != '.') && (String(firstCell.text)[0] != '#') && (String(firstCell.text) != 'undefined')) {
                        // console.log("============>+++:" + String(firstCell.text))
                        if (keywordsList.length == 0) {
                            keywordsList.push(row);
                        } else {
                            /// 判断是否有同名的关键字
                            let currentKeyWordList = keywordsList.slice()
                            for (let m = 0; m < currentKeyWordList.length; m++) {
                                let keyWordRow = currentKeyWordList[m];
                                let keyword = keyWordRow.cells[0].text
                                /// 如果有同名的关键字
                                if (String(keyword) == String(firstCell.text)) {
                                    /// 构建错误信息
                                    let outputInfo = constructOutPutJson(keyWordRow.cells[0].lineNumber, sourceDir + '/' +file, keyWordRow.lineNumber + ',' + row.lineNumber, '文件内有同名的Variable、Keywords、TestCase: ' + keyword,'Error','Same Name')
                                    consoleJson.push(outputInfo);
                                } else if (m == (currentKeyWordList.length-1)){    
                                    /// 不同名则加入数组
                                    keywordsList.push(row);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/// 检测FOR循环内关键字用“\”标识
function checkForLoop(file,tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let cells = table.rows[j].cells;
            if (cells.length > 0) {
                if (cells[0].text == ':FOR') {
                    let nextCells = table.rows[j+1].cells
                    /// 检测for循环首行第一个cell必须为‘\’
                    if (nextCells[0].text != '\\') {
                        let output = constructOutPutJson(cells[0].lineNumber,sourceDir+'/'+file,table.rows[j+1].lineNumber, 'FOR循环内关键字用反斜杠换行', 'Error', 'For Loop')
                        consoleJson.push(output);
                    }
                }
            }
        }
    }
}

/// 检测if后面的语句是否是"..."开头(尚待考虑)
function checkIf(file,tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let cells = table.rows[j].cells;
            if (cells.length > 0) {
                if (cells[0].text == 'Run Keyword If') {
                    let nextCells = table.rows[j+1].cells
                    console.log(nextCells)
                    /// 检测run keyword if下一个row的第一个cell应该为'...'
                    if (nextCells.length == 0) {
                        let output = constructOutPutJson(cells[0].lineNumber,file,table.rows[j+1].lineNumber, 'Run Keyword If条件语句之后的条件代码尽量另起一行，并用\'...\'换行', 'Waring', 'Run Keyword If')
                        consoleJson.push(output);
                    } else if (nextCells[0].text != '...') {
                        let output = constructOutPutJson(cells[0].lineNumber,file,table.rows[j+1].lineNumber, 'Run Keyword If条件语句之后的条件代码尽量另起一行，并用\'...\'换行', 'Waring', 'Run Keyword If')
                        consoleJson.push(output);
                    }
                }
            }
        }
    }
}

/// resource和Test SetUp之间应该空一行
function checkResourceAndTestSetUp(file,tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        if (table.name == 'Settings') {
            for (let j = 0; j < table.rows.length; j++) {
                let cells = table.rows[j].cells;
                /// 如果不是空行
                if (cells.length > 0) {
                    /// 如果有"Test SetUp", 检测前面是否有空行
                    if (cells[0].text == 'Test Setup') {
                        /// 如果‘Test Setup放在第一行’就不做校验
                        if (j!=0) {
                            if (table.rows[j-1].cells.length == 0) {
                                // console.log('====>Test SetUp前有空行')
                            } else {
                                let output = constructOutPutJson(cells[0].lineNumber,sourceDir + '/' +file,table.rows[j].lineNumber, 'Test Setup与前一个关键字之间应该有一个空行','Warning','Line Space')
                                consoleJson.push(output)
                                // console.log('====>Test SetUp前没有空行')
                            }
                        }
                    }
                }
            }
        }
    }
}

/// keyword里面不能包含testCase
function keywordShouldNotContainTestCase(file,tables) {
    var hasKeyWordsTable = false;
    var hasTestCaseTable = false;
    var keyWordsTable = tables[0];
    var TestCaseTable = tables[0];
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        let tableName = table.name;
        if (tableName == 'Keywords') {
            hasKeyWordsTable = true;
            keyWordsTable = table
        }
        if (tableName == 'Test Case') {
            hasTestCaseTable = true;
            TestCaseTable = table
        }
    }
    /// 如果同时都有的话，报告错误
    if (hasKeyWordsTable && hasTestCaseTable) {
        let outputInfo = constructOutPutJson(0, sourceDir + '/' +file, keyWordsTable.lineNumber + ',' + TestCaseTable.lineNumber, 'keyWords和TestCase不能共存', 'Warning', 'KeyWordsAndTestCase')
        consoleJson.push(outputInfo);
    }   
}

/// 字符串判断引号和单引号成对出现
/*
"${result['data']['carType']}" == "2"
'plateNo' in ${result['data']['orderCarVO']}
${length} == 1
${first_follow_period} > 7200
'${flag}'!='FAIL'
*/
function compareStringNeedSingleQuote(file,tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let row = table.rows[j]
            for (let m = 0; m < row.cells.length; m++) {
                let cell = row.cells[m];
                /// 如果有条件判断
                if (String(cell.text) == 'Run Keyword If') {
                    let nextText = row.cells[m+1].text;
                    let equalReg = RegExp(/==/)
                    let unequalReg = RegExp(/!=/)
                    console.log('>>>>>>>>>>>>>>' +  nextText)
                    if (equalReg.test(String(nextText)) || unequalReg.test(String(nextText))) {
                        console.log('<<<<<<<<<<<<<<<<' + String(nextText))
                        /// 如果是开头有单引号
                        if (String(nextText)[0] == '\'') {
                            /// 结尾如果不是单引号，报告错误
                            if (String(nextText)[(String(nextText).length -1)] != '\'') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber,file,row.lineNumber,'字符判断两边都要打上单引号','Warning','quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[0] == '\"') {  /// 如果开头有双引号
                            /// 结尾如果不是双引号，报告错误
                            if (String(nextText)[(String(nextText).length -1)] != '\"') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber,file,row.lineNumber,'字符判断两边都要打上双引号','Warning','quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[(String(nextText).length - 1)] == '\'') {  /// 如果结尾是单引号
                            /// 如果开头不是单引号
                            if (String(nextText)[0] != '\'') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber,file,row.lineNumber,'字符判断两边都要打上单引号','Warning','quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[(String(nextText).length - 1)] == '\"') {  /// 如果结尾是双引号
                            if (String(nextText)[0] != '\"') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber,file,row.lineNumber,'字符判断两边都要打上双引号','Warning','quote');
                                consoleJson.push(outputInfo);
                            }
                        }
                    }
                }
            }
        }
    }
}

/// 字符串使用双引号单引号报警告
function stringUseDoubleQuoteSigleQuoteWarning(file,tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let row = table.rows[j];
            let cells = row.cells;
            for (let m = 0; m < cells.length; m++) {
                let cell = cells[m]
                console.log('>>>>>>>>>>>>>>>>>' + cell.text)
                /// 如果是单引号开头或结尾
                if (cell.text[0] == '\'' || cell.text[cell.text.length - 1] == '\'') {
                    let outPutInfo = constructOutPutJson(cell.lineNumber,file,row.lineNumber,'字符串定义和判断尽量用双引号', 'Warning', 'Quote')
                    consoleJson.push(outPutInfo)
                }
            }
        }
    }
}

/**
 * 违规信息字典
 * 1.character: 违规字符地址;
 * 2.file: 违规文件路径;
 * 3.line: 违规行号;
 * 4.reason: 违规原因;
 * 5.rule_id: 违规规则id;
 * 6.severity: 违规安全策略;
 * 7.type: 违规type
 */
function constructOutPutJson(character,file,line,reason,severity,type) {
    var dic = {'character': character,
                'file': file,
                'line': line,
                'reason': reason,
                'severity': severity,
                'type': type
            }
    return dic;
}

