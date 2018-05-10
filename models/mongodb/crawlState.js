'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var CrawlState = new Schema({
    smartContractAddress: {
        type: String,
        index: true
    },
    blockNumber: {
        type: Number,
        index: true
    }
}, { timestamps: true })

module.exports = mongoose.model('CrawlState', CrawlState)
