'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Penalty = new Schema({
    networkId: Number,
    blockNumber: Number,
    penalties: [{
        type: String,
        index: true
    }]
}, { timestamps: true })

module.exports = mongoose.model('Penalty', Penalty)
