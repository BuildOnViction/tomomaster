'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Status = new Schema({
    penalties: [{
        type: String,
        index: true
    }],
    masternodes: [{
        type: String,
        index: true
    }],
    proposes: [{
        type: String,
        index: true
    }],
    epoch: { type: Number, index: true }
}, { timestamps: true })

module.exports = mongoose.model('Status', Status)
