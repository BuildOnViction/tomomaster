'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')
const abi = require('ethereumjs-abi')

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
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let rewards = await db.VoterReward.find({
        address: (req.params.voter || '').toLowerCase()
    }).sort({ _id: -1 }).limit(limit).skip(skip)
    return res.json(rewards)
})

router.post('/generateQR', async (req, res, next) => {
    try {
        const voter = req.body.voter
        const candidate = req.body.candidate
        const amount = req.body.amount
        const message = 'I, ' + voter + ' vote ' + amount + ' TOMO for candidate ' + candidate
        const id = await abi.soliditySHA3(
            ['address', 'address', 'uint', 'uint'],
            [voter, candidate, amount, (new Date()).getTime() + Math.random().toString()]
        ).toString('hex')
        console.log(`id: 
        
        ${id}`)

        res.send({
            message,
            url: 'https://example.com/',
            id: '0x' + id
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
