'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')
const { validationResult, query } = require('express-validator/check')

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

router.get('/voter/:voter', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Transaction.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase()
        })

        const sort = {}
        const collation = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                collation.locale = 'en_US'
                collation.numericOrdering = true
            }
        } else {
            sort.createdAt = -1
        }

        let txs = await db.Transaction.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase()
        }).sort(sort).collation(collation).limit(limit).skip(skip)

        const txWithNames = await Promise.all(txs.map(async (t) => {
            const c = Object.assign({}, t._doc)
            const b = await db.Candidate.findOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: t.candidate
            }) || {}

            if (t.event === 'Withdraw') {
                c.name = ''
            } else { c.name = b.name || 'Anonymous' }
            return c
        }))
        return res.json({
            items: txWithNames,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/candidate/:candidate', [
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

    try {
        const total = db.Transaction.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: (req.params.candidate || '').toLowerCase()
        })
        const sort = {}
        const collation = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                collation.locale = 'en_US'
                collation.numericOrdering = true
            }
        } else {
            sort.createdAt = -1
        }

        let txs = await db.Transaction.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: (req.params.candidate || '').toLowerCase()
        }).sort(sort).collation(collation).limit(limit).skip(skip)
        return res.json({
            items: txs,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

module.exports = router
