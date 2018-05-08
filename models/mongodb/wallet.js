'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Validator = new Schema({
    address: {
        type: String,
        index: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Validator', Validator)
