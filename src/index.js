#!/usr/bin/env  node

const Path = require('path')
const fs = require('fs')
const Parser = require('./parser')
const [node, path, ...argv] = process.argv
const consoleJson = new Array()
const Pwd = process.cwd();
require('colors');


/// 检测文件
run();

/// 递归查询robot文件
function readFileList(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((item) => {
        var fullpath = Path.join(dir, item);
        const stat = fs.statSync(fullpath);
        if (stat.isDirectory()) {
            readFileList(fullpath, fileList);
        } else if (endWith(item, '.robot')) {
            fileList.push(fullpath);
        }
    });
    return fileList;
}

/// 查找robot文件
function searchFiles(filelist = []) {
    if (filelist.length>0) {
        filelist.forEach((file) => {
            /// 判断文件是.robot后缀
            if (endWith(file, '.robot')) {
                var fileName = file.split('/');
                console.log("⚙  Find a robot file: " + fileName.pop().yellow + ", start lint...");
                lintFile(file)
            }
        });
        console.log('✅  Lint done! There is you report: ');
        /// 检测完后打印违规信息
        console.log(JSON.stringify(consoleJson, null, "\t").green);
    }
}

function run() {
    console.log("🚀  PreLint...");
    console.log("👺  Current Directory: " + Pwd);
    var fileList = readFileList(Pwd);
    if (fileList.length == 0) {
        console.log('❌  没有找到相应的文件，请确认您的当前目录是否是在项目根目录！');
        process.exit();
    }
    searchFiles(fileList);
}

/// 对文件进行lint检测
function lintFile(file) {
    /// 解析关键字
    var parser = new Parser();
    parser.parserFile(file);
    
    /// 检测是否有Documentation"
    fileHasDocumentation(file, parser.tables)

    /// 不重名 (Error)
    noSameName(file, parser.tables)

    /// for循环内关键字是否有反斜杠标识 (Error)
    checkForLoop(file, parser.tables)

    /// if语句下面是否是"..."开头
    checkIf(file, parser.tables)

    /// resource和Test SetUp之间应该空一行
    checkResourceAndTestSetUp(file, parser.tables)

    /// keyword里面不能包含testCase
    keywordShouldNotContainTestCase(file, parser.tables)

    /// 字符串判断引号和单引号成对出现
    compareStringNeedSingleQuote(file, parser.tables)

    /// 字符串定义和比较使用双引号，单引号报警告、
    stringUseDoubleQuoteSigleQuoteWarning(file, parser.tables)

    /// 传参的时候把参数的参数名补上
    completeParameters(file, parser.tables)
}

/// 检测是否写了Documentation
function fileHasDocumentation(file, tables) {
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
                            let outputInfo = constructOutPutJson(row.cells[0].lineNumber,file,table.rows[j].lineNumber,'Settings里面有Documentation,但并没有补全文件信息', 'Warning', 'Documentation')
                            consoleJson.push(outputInfo);
                        }
                    }
                } 
                if (!isHasDocumentation && (j == table.rows.length -1)) {
                    /// 如果没有,构建违规信息
                    let outputInfo = constructOutPutJson(0, file, row.lineNumber, 'Settings里面没有Documentation,为了方便生成文档，建议加上Documentation', 'Warning', 'Documentation')
                    consoleJson.push(outputInfo);
                }
            }
        }
    }
}

/// 是否以某个字符串结尾
function endWith(str, endStr) {
    var location = String(str).length - String(endStr).length
    let isEnd = str.indexOf(endStr) === location
    return isEnd
}

/// Variable、Keywords、TestCase文件内不能重名
function noSameName(file, tables) {
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
                    /// 如果是顶格写的并且不以'...'、'#'开头的cell,则判定为一个Variable/Keywords/TestCase
                    if ((firstCell.lineNumber == 0) && (String(firstCell.text)[0] != '.') && (String(firstCell.text)[0] != '#') && (String(firstCell.text) != 'undefined')) {
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
                                    let outputInfo = constructOutPutJson(keyWordRow.cells[0].lineNumber, file, keyWordRow.lineNumber + ',' + row.lineNumber, '文件内有同名的Variable、Keywords、TestCase: ' + keyword, 'Error', 'Same Name')
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
                    let index = j + 1;
                    /// 过滤注释
                    for (let m = (j+1); m < table.rows.length; m++) {
                        let row = table.rows[m];
                        if (row.cells.length > 0) {
                            if (String(row.cells[0].text).indexOf('#') != 0) {
                                index = m;
                                break;
                            }
                        }
                    }
                    let nextCells = table.rows[index].cells;
                    /// 检测for循环首行第一个cell必须为‘\’, 过滤注释
                    if (nextCells[0].text != '\\') {
                        let output = constructOutPutJson(cells[0].lineNumber, file, table.rows[j+1].lineNumber, 'FOR循环内关键字用反斜杠换行', 'Error', 'For Loop')
                        consoleJson.push(output);
                    }
                }
            }
        }
    }
}

/// 检测if后面的语句是否是"..."开头
function checkIf(file, tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let cells = table.rows[j].cells;
            if (cells.length > 0) {
                if (cells[0].text == 'Run Keyword If') {
                    let nextCells = table.rows[j+1].cells
                    /// 检测run keyword if下一个row的第一个cell应该为'...'
                    if (nextCells.length == 0) {
                        let output = constructOutPutJson(cells[0].lineNumber, file,table.rows[j+1].lineNumber, 'Run Keyword If条件语句之后的条件代码尽量另起一行，并用\'...\'换行 ++', 'Warning', 'Run Keyword If')
                        consoleJson.push(output);
                    } else if (nextCells[0].text != '...') {
                        let str = nextCells[0].text;
                        nextCells.forEach((item) => {
                            str += item.text;
                        });
                        let output = constructOutPutJson(cells[0].lineNumber, file,table.rows[j+1].lineNumber, 'Run Keyword If条件语句之后的条件代码尽量另起一行，并用\'...\'换行 --- ' + nextCells[0].text + '\n' + str, 'Warning', 'Run Keyword If')
                        consoleJson.push(output);
                    }
                }
            }
        }
    }
}

/// resource和Test SetUp之间应该空一行
function checkResourceAndTestSetUp(file, tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        if (table.name == 'Settings') {
            for (let j = 0; j < table.rows.length; j++) {
                let cells = table.rows[j].cells;
                /// 如果不是空行
                if (cells.length > 0) {
                    /// 如果有"Test SetUp", 检测前面是否有空行
                    if (cells[0].text == 'Test Setup') {
                        if (table.rows[j-1].cells.length == 0) {
                            // console.log('====>Test SetUp前有空行')
                        } else {
                            let output = constructOutPutJson(cells[0].lineNumber, file, table.rows[j].lineNumber, 'Test Setup与前一个关键字之间应该有空行', 'Warning', 'Line Space')
                            consoleJson.push(output)
                            // console.log('====>Test SetUp前没有空行')
                        }
                    }
                }
            }
        }
    }
}

/// keyword里面不能包含testCase,（暂时通过比较两个关键字行数）
function keywordShouldNotContainTestCase(file, tables) {
    let hasKeyWordsTable = false;
    let hasTestCaseTable = false;
    let keyWordsTable = tables[0];
    let TestCaseTable = tables[0];
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
    if (hasKeyWordsTable && hasTestCaseTable && (parseInt(keyWordsTable.lineNumber) < parseInt(TestCaseTable.lineNumber))) {
        let outputInfo = constructOutPutJson(0, file, keyWordsTable.lineNumber + ',' + TestCaseTable.lineNumber, 'keyWords里面不应该有Test Case', 'Warning', 'KeyWordsAndTestCase')
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
function compareStringNeedSingleQuote(file, tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let row = table.rows[j]
            for (let m = 0; m < row.cells.length; m++) {
                let cell = row.cells[m];
                /// 如果有条件判断
                if (String(cell.text) == 'Run Keyword If') {
                    /// 如果是最后一个cell，不进行解析
                    if (m == (row.cells.length - 1)) {
                        continue
                    }
                    let nextText = row.cells[m+1].text;
                    let equalReg = RegExp(/==/)
                    let unequalReg = RegExp(/!=/)
                    if (equalReg.test(String(nextText)) || unequalReg.test(String(nextText))) {
                        /// 如果是开头有单引号, 报字符串单引号警告
                        if (String(nextText)[0] == '\'') {
                            /// 结尾如果不是单引号，报告错误
                            if (String(nextText)[(String(nextText).length -1)] != '\'') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber, file,row.lineNumber, '字符判断两边都要打上单引号', 'Warning', 'quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[0] == '\"') {  /// 如果开头有双引号
                            /// 结尾如果不是双引号，报告错误
                            if (String(nextText)[(String(nextText).length -1)] != '\"') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber, file, row.lineNumber, '字符判断两边都要打上双引号', 'Warning', 'quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[(String(nextText).length - 1)] == '\'') {  /// 如果结尾是单引号
                            /// 如果开头不是单引号
                            if (String(nextText)[0] != '\'') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber, file, row.lineNumber, '字符判断两边都要打上单引号', 'Warning', 'quote');
                                consoleJson.push(outputInfo);
                            }
                        } else if (String(nextText)[(String(nextText).length - 1)] == '\"') {  /// 如果结尾是双引号
                            if (String(nextText)[0] != '\"') {
                                let outputInfo = constructOutPutJson(row.cells[m+1].lineNumber, file,row.lineNumber, '字符判断两边都要打上双引号', 'Warning', 'quote');
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
function stringUseDoubleQuoteSigleQuoteWarning(file, tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let row = table.rows[j];
            let cells = row.cells;
            for (let m = 0; m < cells.length; m++) {
                let cell = cells[m]
                /// 如果是单引号开头或结尾
                if (cell.text[0] == '\'' || cell.text[cell.text.length - 1] == '\'') {
                    let outPutInfo = constructOutPutJson(cell.lineNumber, file, row.lineNumber, '字符串定义和判断尽量用双引号', 'Warning', 'Quote')
                    consoleJson.push(outPutInfo)
                }
            }
        }
    }
}

/// 传参的时候把参数的参数名补上
function completeParameters(file, tables) {
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i];
        for (let j = 0; j < table.rows.length; j++) {
            let row = table.rows[j];
            let cells = row.cells;
            for (let m = 0; m < cells.length; m++) {
                let cell = cells[m];
                /// 不是关键字或者suite名
                if (cell.lineNumber != 0) {
                    /// 查找语句里面是否带有中文的
                    let cellText = cell.text;
                    let chinessReg = RegExp(/(^[a-z]+|^[\u4e00-\u9fa5]+)[\u4e00-\u9fa5]+/);
                    if (chinessReg.test(cellText)) {
                        /// 取下一个cell
                        if (m != (cells.length - 1)) {
                            let nextCell = cells[m+1];
                            let patamserList = nextCell.text.split('=');
                            /// 如果=切分后只有一个元素则报警告
                            if (patamserList.length < 2) {
                                let outPutInfo = constructOutPutJson(nextCell.lineNumber, file, row.lineNumber, '传参的时候没有把参数名补齐。关键字: ' + cellText, 'Warning', 'ParameterName')
                                consoleJson.push(outPutInfo)
                            }   
                        }
                    }
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
function constructOutPutJson(character, file, line, reason, severity, type) {
    var dic= { "character": character,
                "file": file,
                "line": line,
                "reason": reason,
                "severity": severity,
                "type": type
            }
    return dic;
}
