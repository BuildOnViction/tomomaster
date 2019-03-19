'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var NameHistory = new Schema({
    from: String,
    to: String,
    candidate: String,
    blockNumber: Number
}, { timestamps: true })

module.exports = mongoose.model('NameHistory', NameHistory)
