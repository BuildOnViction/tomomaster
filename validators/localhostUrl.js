'use strict'

Object.defineProperty(exports, '__esModule', {
    value: true
})

var _common = require('vuelidate/lib/validators/common')

// eslint-disable-next-line max-len
var urlRegex = /^(https?):\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/i

exports.default = (0, _common.regex)('localhostUrl', urlRegex)
