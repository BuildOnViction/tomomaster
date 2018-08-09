'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Withdraw = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    tx: {
        type: String,
        index: true
    },
    owner: {
        type: String,
        index: true
    },
    blockNumber: {
        type: String,
        index: true
    },
    capacity: String
}, { timestamps: true })

module.exports = mongoose.model('Withdraw', Withdraw)
