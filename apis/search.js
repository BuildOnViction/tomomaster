'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:candidate', async function (req, res, next) {
    const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
    let search = req.params.candidate
    let candidate = {}
    let voter = {}

    if (regexpAddr.test(search)) {
        candidate = (await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: search
        }) || {})

        voter = (await db.Voter.findOne({
            voter: search
        }) || {})

        return res.json({ candidate, voter })
    }
    return res.json({ candidate, voter })
})

module.exports = router
