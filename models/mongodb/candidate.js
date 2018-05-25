'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Candidate = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    backer: {
        type: String,
        index: true
    },
    nodeUrl: String,
    candidate: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['PROPOSED', 'RESIGNED'],
        index: true
    },
    capacity: String
}, { timestamps: true })

module.exports = mongoose.model('Candidate', Candidate)
