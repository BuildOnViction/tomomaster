'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')

router.get('/', async function (req, res, next) {
    let candidates = await db.Candidate.find().limit(100).skip(0)
    return res.json(candidates)
})

router.get('/:candidate/voters', async function (req, res, next) {
    let voters = await db.Voter.find({
        candidate: req.params.candidate
    }).limit(100).skip(0)
    return res.json(voters)
})

module.exports = router
