'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Notification = new Schema({
    voter: { type: String, index: true },
    candidate: String,
    candidateName: String,
    event: String,
    isRead: Boolean
}, { timestamps: true })

module.exports = mongoose.model('Notification', Notification)
