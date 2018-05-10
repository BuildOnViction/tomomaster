'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')

router.get('/voter/:voter', async function (req, res, next) {
    let txs = await db.Transaction.find({
        voter: req.params.voter
    }).limit(100).skip(0)
    return res.json(txs)
})

router.get('/candidate/:candidate', async function (req, res, next) {
    let txs = await db.Transaction.find({
        candidate: req.params.candidate
    }).limit(100).skip(0)
    return res.json(txs)
})

module.exports = router
