'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')

router.get('/', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let candidates = await db.Candidate.find({
        smartContractAddress: validator.address
    }).limit(limit).skip(skip)
    return res.json(candidates)
})

router.get('/:candidate', async function (req, res, next) {
    let candidate = await db.Candidate.findOne({
        candidate: req.params.candidate
    })
    return res.json(candidate)
})

router.get('/:candidate/voters', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let voters = await db.Voter.find({
        smartContractAddress: validator.address,
        candidate: req.params.candidate
    }).limit(limit).skip(skip)
    return res.json(voters)
})

module.exports = router
