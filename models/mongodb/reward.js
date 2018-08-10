'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Reward = new Schema({
    address: {
        type: String,
        index: true
    },
    checkpoint: {
        type: String,
        index: true
    },
    reward: {
        type: String
    },
    signNumber: Number
}, { timestamps: true })

module.exports = mongoose.model('Reward', Reward)
