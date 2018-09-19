'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/:tx', async function (req, res, next) {
    let tx = await db.Transaction.findOne({
        tx: req.params.tx
    })

    return res.json(tx)
})

router.get('/voter/:voter', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let txs = await db.Transaction.find({
        smartContractAddress: validator.address,
        voter: (req.params.voter || '').toLowerCase()
    }).sort({ _id: -1 }).limit(limit).skip(skip)
    return res.json(txs)
})

router.get('/candidate/:candidate', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let txs = await db.Transaction.find({
        smartContractAddress: validator.address,
        candidate: (req.params.candidate || '').toLowerCase()
    }).sort({ _id: -1 }).limit(limit).skip(skip)
    return res.json(txs)
})

module.exports = router
