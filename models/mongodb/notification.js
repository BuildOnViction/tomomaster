'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Notification = new Schema({
    voter: { type: String, index: true },
    candidate: { type: String, index: true },
    candidateName: String,
    event: {
        type: String,
        enum: ['Propose', 'Resign', 'Slash', 'Outtop', 'Withdraw']
    },
    isRead: Boolean,
    blockNumber: { type: Number, index: true }
}, { timestamps: true })

module.exports = mongoose.model('Notification', Notification)
