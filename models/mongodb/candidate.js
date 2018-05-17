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
    capacity: String
}, { timestamps: true })

module.exports = mongoose.model('Candidate', Candidate)
