'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var VoteHistory = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    blockNumber: {
        type: Number,
        index: true
    },
    voters: [{
        capacity: String,
        address: String
    }],
    candidate: {
        type: String,
        index: true
    }
}, { timestamps: true })

module.exports = mongoose.model('VoteHistory', VoteHistory)
