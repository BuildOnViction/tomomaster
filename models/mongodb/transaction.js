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
    backer: {
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
    capacity: String
}, { timestamps: true })

module.exports = mongoose.model('Transaction', Transaction)
