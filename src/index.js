#!/usr/bin/env  node

const Path = require('path')
const fs = require('fs')
const glob = require('glob')
const readlineSync = require('../readline-sync')
require('colors')

// 检测文件
searchFiles()

/// 查找robot文件
function searchFiles(path) {
    glob('**/*.robot',function (error,files) {
        if (files.length==0) {
            console.log(`'No lintable files found at path \'\''`.red)
        } else {
            console.log('Linting robot files in current working directory')
            files.forEach(function (file) {
                console.log('Linting ' + '\'' + file + '\'')
                lintFile(file)
            })
        }
    })
}

/// 对文件进行lint检测
function lintFile(file) {
    /// 检测是否有Documentation"
    fileHasDocumentation(file)

    /// 不重名
    noSameName(file)

    /// for循环内关键字是否有反斜杠标识
    checkForLoop(file)

    /// if语句下面是否是"..."开头
    checkIf(file)

}

/// 检测是否写了Documentation
function fileHasDocumentation(file) {
    if (!fs.existsSync(file)) {
        console.log('文件不存在!')
        return 
    }
    const liner = new readlineSync()
    liner.open(file)
    let lineContent;
    var contentHasDocuments = false;
    while(!liner.EOF) {
        lineContent = liner.next()
        if (lineContent === null || String(lineContent).length == 0 || lineContent === undefined) {
            console.log('==>'+lineContent)
            continue
        }
        if (String(lineContent).indexOf('Documentation') === 0 && String(trim(lineContent)).length > 13) {
            contentHasDocuments = true;
            return;
        } else {
            contentHasDocuments = false
        }
    }
    if (!contentHasDocuments) {
        console.log(`文件: ${file}, Settings里面没有\'Documentation\',为了方便生成文档，建议加上Documentation`.red)
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
function noSameName(file) {
    
}

/// 检测FOR循环内关键字用“\”标识
function checkForLoop(file) {
    const liner = new readlineSync()
    liner.open(file)
    let lineContent
    let theline = 0
    let lineNumber = 0;
    while(!liner.EOF) {
        lineContent = liner.next()
        lineNumber += 1
        if (trim(String(lineContent)).indexOf(':FOR') === 0) {
            theline = lineNumber
        }
        /// 如果是for循环内第一行
        if (lineNumber == (theline+1) && theline != 0) {
            if (!(trim(String(lineContent)).indexOf('\\') === 0)) {
                console.log('for循环内语句没有\'\\\'开头')
                return
            }
        }   
    }
}

/// 检测if后面的语句是否是"..."开头
function checkIf(file) {
    
}


