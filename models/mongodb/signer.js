'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Signer = new Schema({
    networkId: Number,
    blockNumber: Number,
    signers: [{
        type: String,
        index: true
    }]
}, { timestamps: true })

module.exports = mongoose.model('Signer', Signer)
