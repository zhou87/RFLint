const fs = require('fs');

const LineReader = function lineReader(path) {
  this.leftOver = '';
  this.EOF = false;
  this.filename = '';
  this.fd = 0;
  this.bufferSize = 1024;
  this.buffer = new Buffer(this.bufferSize);
  if (undefined !== path) {
    try {
      fs.statSync(path).isFile();
      this.open(path);
    } catch (exception) {
      console.log(path, 'is not a file.');
      this.EOF = false;
    }
  }
};

LineReader.prototype.close = function close() {
  const self = this;
  try {
    fs.closeSync(self.fd);
  } catch (exception) {
    console.log('closing file failed.');
  }
  self.EOF = true;
  self.fd = 0;
};

LineReader.prototype.next = function next() {
  const self = this;
  if (self.fd === 0) {
    return;
  }
  let idxStart = 0;
  let idx = 0;
  while ((self.leftOver.indexOf('\n', idxStart)) == -1) {
    let read;
    try {
      read = fs.readSync(self.fd, self.buffer, 0, self.bufferSize, null);
    } catch (exception) {
      console.log('reading file failed.');
      self.close();
      return;
    }
    if (read !== 0) {
      self.leftOver += self.buffer.toString('utf8', 0, read);
    } else {
      try {
        fs.closeSync(self.fd);
      } catch (exception) {
        console.log('closing file failed.');
      }
      self.EOF = true;
      self.fd = 0;
      return;
    }
  }
  idx = self.leftOver.indexOf('\n', idxStart);
  if (idx !== -1) {
    const line = self.leftOver.substring(idxStart, idx);
    idxStart = idx + 1;
    self.leftOver = self.leftOver.substring(idxStart);
    idxStart = 0;
    return line;
  }
};

LineReader.prototype.open = function open(thePath) {
  const self = this;
  self.filename = thePath;
  if (self.fd !== 0) {
    self.close();
  }
  try {
    self.fd = fs.openSync(self.filename, 'r');
  } catch (exception) {
    console.log('open(): ' + self.filename + ' not found.');
    self.EOF = true;
    return;
  }
  self.EOF = false;
};

module.exports = LineReader;