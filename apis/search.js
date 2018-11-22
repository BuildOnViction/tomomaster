'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const config = require('config')

router.get('/:candidate', async function (req, res, next) {
    const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
    let search = req.params.str
    search = search.trim()

    if (regexpAddr.test(search)) {
        const candidate = (await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: req.params.candidate
        }) || {})

        const voter = (await db.Voter.findOne({
            voter: req.params.candidate
        }) || {})

        return res.json({ candidate, voter })
    }

    // let candidate = (await db.Candidate.findOne({
    //     smartContractAddress: config.get('blockchain.validatorAddress'),
    //     candidate: req.params.candidate
    // }) || {})

    // let voter = (await db.Voter.findOne({
    //     voter: req.params.candidate
    // }) || {})

    // return res.json({ candidate, voter })
})

module.exports = router
