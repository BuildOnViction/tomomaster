'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')

router.get('/:voter/candidates', async function (req, res, next) {
    let voters = await db.Voter.find({
        voter: req.params.voter
    }).limit(100).skip(0)
    return res.json(voters)
})

module.exports = router
