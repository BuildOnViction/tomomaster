'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Transaction = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    tx: {
        type: String,
        index: true
    },
    event: {
        type: String,
        index: true
    },
    owner: {
        type: String,
        index: true
    },
    voter: {
        type: String,
        index: true
    },
    candidate: {
        type: String,
        index: true
    },
    capacity: String,
    createdAt: { type: Date, default: Date.now, index: true },
    blockNumber: { type: Number, index: true },
    currentCandidateCap: String
}, { timestamps: false })

module.exports = mongoose.model('Transaction', Transaction)
