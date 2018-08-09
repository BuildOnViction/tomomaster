'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/:owner/withdraws', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let wds = await db.Withdraw.find({
        smartContractAddress: validator.address,
        owner: req.params.owner
    }).limit(limit).skip(skip)
    return res.json(wds)
})

module.exports = router
