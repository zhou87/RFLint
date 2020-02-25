#!usr/bin/env node

const fs = require('fs')
const readlineSync = require('./readline-sync')
const settingsTable = require('./tables/SettingsTable')
const table = require('./tables/Table')
const keywordTable = require('./tables/KeyWorksTable')
const testCaseTable = require('./tables/TestCaseTable')
const variablesTable = require('./tables/VariableTable')
const Cell = require('./tables/Cell')
const Row = require('./tables/Row')

class Parser {

    constructor() {
        this.tables = [];
    }

    /// 解析关键字
    parserFile(file) {
        const liner = new readlineSync();
        liner.open(file);
        var lineNumber = 0;
        var lineContent = '';
        var currentTable = this.tables[0];
        while (!liner.EOF) {
            /// 文件行号从1开始
            lineNumber += 1;
            /// 每行内容
            lineContent = liner.next();
            // console.log(lineNumber + '  |  '  + lineContent);
            /// 如果是*** xxx ***开头则创建一个table
            if (String(lineContent).indexOf('***') == 0) {
                var settingReg = RegExp(/Settings/)
                var keyWordsReg = RegExp(/Keywords/)
                var testCaseReg = RegExp(/Test Case/)
                var variablesReg = RegExp(/Variable/)
                var lastTabel = NaN
                if (this.tables.length > 0) {
                    lastTabel = this.tables[this.tables.length - 1]
                } 
                /// 构建不同类型的table
                if (settingReg.test(String(lineContent))) {
                    let Stable = new table(lastTabel, `Settings`, lineContent,lineNumber);
                    /// 更新currentTable
                    this.refreshTable(currentTable)
                    this.tables.push(Stable);
                    currentTable = Stable;
                } else if (keyWordsReg.test(String(lineContent))) {
                    let Ktable = new table(lastTabel, 'Keywords', lineContent, lineNumber);
                    this.refreshTable(currentTable)
                    this.tables.push(Ktable);
                    currentTable = Ktable;
                } else if (testCaseReg.test(String(lineContent))) {
                    let Ttable = new table(lastTabel, 'Test Case', lineContent, lineNumber);
                    this.refreshTable(currentTable)
                    this.tables.push(Ttable);
                    currentTable = Ttable;
                } else if (variablesReg.test(String(lineContent))) {
                    let Vtable = new table(lastTabel, 'Variable', lineContent, lineNumber);
                    this.refreshTable(currentTable)
                    this.tables.push(Vtable);
                    currentTable = Vtable;
                } 
            } else {
                let cells = this.parserCells(lineContent);
                let row = new Row(lineNumber,cells)
                currentTable.rows.push(row)
            }
        }
    }

    /// 更新currentTable
    refreshTable(currentTable) {
        if (this.tables.length > 0) {
            this.tables.pop();
            this.tables.push(currentTable);
        }
    }

    /// 解析单行数据 row -> cells
    parserCells(content) {
        let contentStr = String(content);
        if (contentStr.length == 0) {
            return [];
        }
        var cells = [];
        var firstChr = contentStr[0];
        var secondChr = contentStr[0];
        var currentWord = [];
        for (let i = 0; i < contentStr.length; i++) {
            let currentChr = contentStr[i];
            let firstIndex = Math.max(i-1,0);
            firstChr = contentStr[firstIndex];
            secondChr = currentChr;
            if (secondChr != ' ') {
                currentWord.push(currentChr);
            } else if (secondChr == ' ' && firstChr != ' ') {   /// 这里会多加一个空格进去
                currentWord.push(currentChr);
            }
            /// 如果字符之间有两个空格则取出一个cell，开始读取下一个cell
            if (firstChr == ' ' && secondChr == ' ') {
                if (currentWord.length > 0 && currentWord[0] != ' ') {
                    /// 之前会在Word后面多加一个' ',这里发现有多加就去掉
                    if (currentWord[currentWord.length-1] == ' ') {
                        currentWord.pop();
                    }
                    let cell =  new Cell(currentWord.join(''),i - currentWord.length-1);
                    cells.push(cell);
                    currentWord = []
                }
            } 
            /// 加上最后一个word
            if (i == (contentStr.length-1) && currentWord.length > 0) {
                if (currentWord[currentWord.length-1] == ' ') {
                    currentWord.pop();
                }
                let cell = new Cell(currentWord.join(''),contentStr.length - currentWord.length)
                cells.push(cell);
            }
        }
        return cells
    }
}

module.exports = Parser;