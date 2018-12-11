'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Voter = new Schema({
    signedAddress: { type: String, unique: true, index: true },
    signId: { type: String, index: true },
    candidate: {
        type: String,
        index: true
    },
    amount: String,
    rawTx: String,
    action: String,
    tx: String,
    status: Boolean
}, { timestamps: true })

module.exports = mongoose.model('SignTransaction', Voter)
