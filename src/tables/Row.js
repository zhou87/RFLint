#!usr/bin/env node

class Row {
    constructor(lineNumber,cells) {
        this.lineNumber = lineNumber;
        this.cells = cells;
    }
}

module.exports = Row;