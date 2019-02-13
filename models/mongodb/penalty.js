'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Penalty = new Schema({
    networkId: Number,
    blockNumber: { type: Number, index: true },
    penalties: [{
        type: String,
        index: true
    }],
    epoch: { type: Number, index: true }
}, { timestamps: true })

module.exports = mongoose.model('Penalty', Penalty)
