'use strict'

Object.defineProperty(exports, '__esModule', {
    value: true
})

var _common = require('vuelidate/lib/validators/common')

// eslint-disable-next-line max-len
var nodeUrlRegex = /^(enode:\/\/[a-fA-F0-9]{128}@\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d{1,5}\b$)/

exports.default = (0, _common.regex)('nodeUrl', nodeUrlRegex)
