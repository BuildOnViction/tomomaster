'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Status = new Schema({
    status: { type: String },
    candidate: { type: String, index: true },
    epoch: { type: Number, index: true },
    epochCreatedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('Status', Status)
