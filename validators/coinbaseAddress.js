'use strict'

Object.defineProperty(exports, '__esModule', {
    value: true
})

var _common = require('vuelidate/lib/validators/common')

var coinbaseRegex = /^0x[a-fA-F0-9]{40}$/

exports.default = (0, _common.regex)('coinbase', coinbaseRegex)
