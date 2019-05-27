'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Signature = new Schema({
    signedAddress: { type: String, unique: true, index: true },
    signedId: { type: String, index: true },
    message: String,
    signature: String,
    status: Boolean,
    expiredAt: { type: Date, expires: 86400, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Signature', Signature)
