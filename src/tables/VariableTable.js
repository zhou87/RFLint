#!usr/bin/env node

const Table = require('./Table');

class VariableTable extends Table {
    constructor(parent,name,header,lineNumber) {
        super(parent,name,header,lineNumber);
    }
}

module.exports = VariableTable;