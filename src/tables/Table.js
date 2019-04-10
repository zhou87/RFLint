#!usr/bin/env node

class Table {
    constructor(parent,name,header,lineNumber) {
        this.parent = parent;
        this.name = name;                         /// table名
        this.header = header;
        this.lineNumber =lineNumber;
        this.rows = [];
    }
}

module.exports = Table;