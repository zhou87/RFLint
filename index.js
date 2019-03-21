#!/usr/bin/env  node

var lint = require('./a')
const Path = require('path')
const fs = require('fs')
const glob = require('glob')
const readlineSync = require('./readline-sync')
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
        if (String(trim(lineContent)).indexOf('Documentation') === 0 && String(trim(lineContent)).length > 13) {
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

function trim(str) {
    return str.replace(/\s|\xA0/g,"");    
}

/// Variable、Keywords、TestCase文件内不能重名
function noSameName(file) {
    
}