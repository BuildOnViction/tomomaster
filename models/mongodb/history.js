'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var History = new Schema({
    name: String,
    candidate: String,
    blockNumber: Number,
    hardware: String,
    dataCenter: {
        name: String,
        location: String
    },
    socials: {
        github: String,
        linkedin: String,
        email: String,
        website: String,
        telegram: String
    }
}, { timestamps: true })

module.exports = mongoose.model('History', History)
