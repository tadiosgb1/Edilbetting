'use strict';

function ts() { return new Date().toISOString(); }

module.exports = {
  info:  (...a) => console.log( `[INFO  ${ts()}]`, ...a),
  warn:  (...a) => console.warn( `[WARN  ${ts()}]`, ...a),
  error: (...a) => console.error(`[ERROR ${ts()}]`, ...a),
};
