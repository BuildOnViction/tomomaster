'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:candidate', async function (req, res, next) {
    let search = req.params.candidate
    let candidate = {}
    let voter = {}

    candidate = (await db.Candidate.findOne({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: search.toLowerCase()
    }) || {})

    voter = (await db.Voter.findOne({
        voter: search.toLowerCase()
    }) || {})

    return res.json({ candidate, voter })
})

module.exports = router
