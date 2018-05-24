'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Candidate = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    candidate: {
        type: String,
        index: true
    },
    name: String,
    capacity: String,
    latestBlock: String,
    totalSignedBlocks: String,
    rewarded: String,
    hardwareInfo: String,
    dataCenterInfo: Object,
    socialInfo: Object
}, { timestamps: true })

module.exports = mongoose.model('Candidate', Candidate)
