'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var FdReward = new Schema({
    address: {
        type: String,
        index: true
    },
    checkpoint: {
        type: String,
        index: true
    },
    startBlockNumber: String,
    endBlockNumber: String,
    reward: String
}, { timestamps: true })

module.exports = mongoose.model('FdReward', FdReward)
