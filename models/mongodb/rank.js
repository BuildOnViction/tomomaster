'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Rank = new Schema({
    candidate: Number,
    rank: Number,
    capacity: String,
    capacityNumber: Number,
    epoch: Number,
    epochCreatedAt: Date
}, { timestamps: true })

module.exports = mongoose.model('Rank', Rank)
