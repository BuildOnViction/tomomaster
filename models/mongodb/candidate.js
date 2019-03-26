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
    capacityNumber: { type: Number, index: true },
    latestBlock: String,
    totalSignedBlocks: String,
    rewarded: String,
    hardware: String,
    dataCenter: {
        name: String,
        location: String
    },
    latestSignedBlock: Number,
    socials: {
        github: String,
        linkedin: String,
        email: String,
        website: String,
        telegram: String
    },
    status: {
        type: String,
        enum: ['PROPOSED', 'RESIGNED', 'SLASHED', 'MASTERNODE'],
        index: true
    },
    rank: Number
}, { timestamps: true })

module.exports = mongoose.model('Candidate', Candidate)
