'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Signature = new Schema({
    signedAddress: { type: String, unique: true, index: true },
    signedId: { type: String, index: true },
    message: String,
    signature: String
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Signature', Signature)
