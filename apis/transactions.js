'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/voter/:voter', async function (req, res, next) {
    let validator = await Validator.deployed()
    let txs = await db.Transaction.find({
        smartContractAddress: validator.address,
        voter: req.params.voter
    }).limit(100).skip(0)
    return res.json(txs)
})

router.get('/candidate/:candidate', async function (req, res, next) {
    let validator = await Validator.deployed()
    let txs = await db.Transaction.find({
        smartContractAddress: validator.address,
        candidate: req.params.candidate
    }).limit(100).skip(0)
    return res.json(txs)
})

module.exports = router
