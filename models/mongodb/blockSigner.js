'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var BlockSigner = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    blockNumber: {
        type: String,
        index: true
    },
    signers: [{
        type: String,
        index: true
    }]
}, { timestamps: true })

module.exports = mongoose.model('BlockSigner', BlockSigner)
