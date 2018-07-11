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
        signer: {
            type: String,
            index: true
        },
        tx: String
    }]
}, { timestamps: true })

module.exports = mongoose.model('BlockSigner', BlockSigner)
