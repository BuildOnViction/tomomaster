'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
// For withdrawal notification
var WithdrawNoti = new Schema({
    voter: {
        type: String,
        index: true
    },
    blockNumber: {
        type: Number,
        index: true
    },
    withdrawBlockNumber: {
        type: Number,
        index: true
    },
    amount: { type: Number, index: true },
    candidate: { type: String, index: true }
}, { timestamps: true })

module.exports = mongoose.model('WithdrawNoti', WithdrawNoti)
