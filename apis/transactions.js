'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:tx', async function (req, res, next) {
    try {
        let tx = await db.Transaction.findOne({
            tx: req.params.tx
        })

        return res.json(tx)
    } catch (e) {
        return next(e)
    }
})

router.get('/voter/:voter', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        let txs = await db.Transaction.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase()
        }).sort({ createdAt: -1 }).limit(limit).skip(skip)
        return res.json(txs)
    } catch (e) {
        return next(e)
    }
})

router.get('/candidate/:candidate', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0

    try {
        let txs = await db.Transaction.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: (req.params.candidate || '').toLowerCase()
        }).sort({ createdAt: -1 }).limit(limit).skip(skip)
        return res.json(txs)
    } catch (e) {
        return next(e)
    }
})

module.exports = router
