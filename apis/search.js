'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/:candidate', async function (req, res, next) {
    let validator = await Validator.deployed()
    let candidate = (await db.Candidate.findOne({
        smartContractAddress: validator.address,
        candidate: req.params.candidate
    }) || {})

    let voter = (await db.Voter.findOne({
        voter: req.params.candidate
    }) || {})

    return res.json({ candidate, voter })
})

module.exports = router
