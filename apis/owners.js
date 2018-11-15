'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:owner/withdraws', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let wds = await db.Withdraw.find({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        owner: req.params.owner
    }).limit(limit).skip(skip)
    return res.json(wds)
})

module.exports = router
