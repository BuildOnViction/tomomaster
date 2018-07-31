'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')
const HDWalletProvider = require('truffle-hdwallet-provider')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const config = require('config')

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
    let validator = await Validator.deployed()
    let candidate = await db.Candidate.findOne({
        smartContractAddress: validator.address,
        candidate: req.params.candidate
    })
    candidate.totalSignedBlocks = await db.BlockSigner.count({
        'signers.signer': req.params.candidate
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
        await validator.propose(req.query.coinbase, '', {
            from : walletProvider.address,
            value: 50000 * 10 ** 18
        })
        return res.json({ status: 'OK' })
    } catch (e) {
        return res.json({ status: 'NOK' })
    }
})

module.exports = router
