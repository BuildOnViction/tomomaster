'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Candidate = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    owner: {
        type: String,
        index: true
    },
    nodeId: String,
    candidate: {
        type: String,
        index: true
    },
    name: String,
    capacity: String,
    latestBlock: String,
    totalSignedBlocks: String,
    rewarded: String,
    hardware: String,
    dataCenter: {
        name: String,
        location: String
    },
    socials: {
        github: String,
        linkedin: String,
        email: String
    },
    status: {
        type: String,
        enum: ['PROPOSED', 'RESIGNED'],
        index: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Candidate', Candidate)
