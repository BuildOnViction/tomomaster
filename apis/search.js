'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:candidate', async function (req, res, next) {
    let candidate = (await db.Candidate.findOne({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: req.params.candidate
    }) || {})

    let voter = (await db.Voter.findOne({
        voter: req.params.candidate
    }) || {})

    return res.json({ candidate, voter })
})

module.exports = router
