'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Rank = new Schema({
    candidate: { type: Number, index: true },
    rank: Number,
    epoch: { type: Number, index: true },
    epochCreatedAt: Date
}, { timestamps: true })

module.exports = mongoose.model('Rank', Rank)
