'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')
const uuidv4 = require('uuid/v4')
const config = require('config')

router.get('/:voter/candidates', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let voters = await db.Voter.find({
        smartContractAddress: validator.address,
        voter: (req.params.voter || '').toLowerCase()
    }).limit(limit).skip(skip)
    return res.json(voters)
})

router.get('/:voter/rewards', async function (req, res, next) {
    try {
        const voter = req.params.voter
        const limit = 100
        const rewards = await axios.post(
            `${config.get('tomoscanUrl')}/api/expose/rewards`,
            {
                address: voter,
                limit
            }
        )
        res.json(rewards.data)
    } catch (e) {
        return next(e)
    }
})

router.post('/generateQR', async (req, res, next) => {
    try {
        const voter = req.body.voter
        const amount = req.body.amount
        const candidate = (req.body.candidate || '').toLowerCase()
        const message = voter + ' vote ' + amount + ' TOMO for candidate ' + candidate
        let validator = await Validator.deployed()
        let candidateInfo = (await db.Candidate.findOne({
            smartContractAddress: validator.address,
            candidate: candidate
        }) || {})

        res.send({
            candidateName: candidateInfo.name ? candidateInfo.name : 'Anonymous Candidate',
            message,
            url: 'https://example.com/',
            id: uuidv4()
        })
    } catch (e) {
        console.log(e)
        res.send({
            error: {
                message: e
            }
        })
    }
})

module.exports = router
