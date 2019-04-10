#!usr/bin/env node

class Cell {
    constructor(text,lineNumber) {
        this.text = text;
        this.lineNumber = lineNumber;
    }
}

module.exports = Cell