'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/', async function (req, res, next) {
    let validator = await Validator.deployed()
    let candidates = await db.Candidate.find({
        smartContractAddress: validator.address
    }).limit(100).skip(0)
    return res.json(candidates)
})

router.get('/:candidate/voters', async function (req, res, next) {
    let validator = await Validator.deployed()
    let voters = await db.Voter.find({
        smartContractAddress: validator.address,
        candidate: req.params.candidate
    }).limit(100).skip(0)
    return res.json(voters)
})

module.exports = router
