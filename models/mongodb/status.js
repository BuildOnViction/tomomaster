'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Status = new Schema({
    penalties: [{
        type: String
    }],
    masternodes: [{
        type: String
    }],
    proposes: [{
        type: String
    }],
    epoch: { type: Number, index: true },
    blockCreatedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('Status', Status)
