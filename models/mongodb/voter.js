'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Voter = new Schema({
    smartContractAddress: {
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
    capacityNumber: { type: Number, index: true }
}, { timestamps: true })

module.exports = mongoose.model('Voter', Voter)
