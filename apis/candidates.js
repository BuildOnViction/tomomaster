'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')
const { HDWalletProvider } = require('../helpers')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const config = require('config')

router.get('/', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 150
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        let validator = await Validator.deployed()

        let data = await Promise.all([
            db.Candidate.find({
                smartContractAddress: validator.address
            }).limit(limit).skip(skip).lean().exec(),
            db.Signer.findOne({}).sort({ _id: 'desc' })
        ])

        let candidates = data[0]
        let latestSigners = data[1]

        const signers = latestSigners.signers
        const set = new Set()
        for (let i = 0; i < signers.length; i++) {
            set.add(signers[i])
        }

        let map = candidates.map(async c => {
            let bs = await db.BlockSigner.findOne({
                'signers.signer': c.candidate
            }).sort({ _id: 'desc' })
            c.latestSignedBlock = (bs || {}).blockNumber || 0

            // is masternode
            c.isMasternode = set.has(c.candidate)
            return c
        })
        let ret = await Promise.all(map)

        return res.json(ret)
    } catch (e) {
        return next(e)
    }
})

router.get('/:candidate', async function (req, res, next) {
    let validator = await Validator.deployed()
    let address = (req.params.candidate || '').toLowerCase()
    let candidate = (await db.Candidate.findOne({
        smartContractAddress: validator.address,
        candidate: address
    }) || {})

    candidate.totalSignedBlocks = await db.BlockSigner.countDocuments({
        'signers.signer': address
    })
    return res.json(candidate)
})

router.get('/:candidate/voters', async function (req, res, next) {
    let validator = await Validator.deployed()
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let voters = await db.Voter.find({
        smartContractAddress: validator.address,
        candidate: (req.params.candidate || '').toLowerCase()
    }).limit(limit).skip(skip)
    return res.json(voters)
})

router.get('/:candidate/rewards', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let rewards = await db.MnReward.find({
        address: (req.params.candidate || '').toLowerCase()
    }).sort({ _id: -1 }).limit(limit).skip(skip)
    return res.json(rewards)
})

router.post('/apply', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)
        Validator.setProvider(walletProvider)
        let validator = await Validator.deployed()
        await validator.propose(req.query.coinbase, (req.query.nodeId || ''), {
            from : walletProvider.address,
            value: 50000 * 10 ** 18
        })
        return res.json({ status: 'OK' })
    } catch (e) {
        return res.json({ status: 'NOK' })
    }
})

module.exports = router
