'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')
const { validationResult, query } = require('express-validator/check')

router.get('/:owner/withdraws', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip

    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let wds = await db.Withdraw.find({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        owner: req.params.owner
    }).limit(limit).skip(skip)
    return res.json(wds)
})

module.exports = router
