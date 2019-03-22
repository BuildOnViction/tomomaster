'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Rank = new Schema({
    candidate: Number,
    rank: Number,
    epoch: Number,
    epochCreatedAt: Date
}, { timestamps: true })

module.exports = mongoose.model('Rank', Rank)
