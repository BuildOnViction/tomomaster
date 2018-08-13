'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var VoterReward = new Schema({
    address: {
        type: String,
        index: true
    },
    candidate: {
        type: String,
        index: true
    },
    checkpoint: {
        type: String,
        index: true
    },
    startBlockNumber: String,
    endBlockNumber: String,
    voted: String,
    reward: String,
    signNumber: Number
}, { timestamps: true })

module.exports = mongoose.model('VoterReward', VoterReward)
