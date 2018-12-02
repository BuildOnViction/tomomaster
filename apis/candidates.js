'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../models/mongodb')
const web3 = require('../models/blockchain/web3rpc')
const validator = require('../models/blockchain/validatorRpc')
const HDWalletProvider = require('truffle-hdwallet-provider')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const config = require('config')
const _ = require('lodash')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

router.get('/', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        let data = await Promise.all([
            db.Candidate.find({
                smartContractAddress: config.get('blockchain.validatorAddress')
            }).sort({ capacityNumber: 'desc' }).limit(limit).skip(skip).lean().exec(),
            db.Signer.findOne({}).sort({ _id: 'desc' }),
            db.Penalty.findOne({}).sort({ _id: 'desc' })
        ])

        let candidates = data[0]
        let latestSigners = data[1]
        let latestPenalties = data[2]

        const signers = (latestSigners || {}).signers || []
        const penalties = (latestPenalties || {}).penalties || []
        const setS = new Set()
        for (let i = 0; i < signers.length; i++) {
            setS.add((signers[i] || '').toLowerCase())
        }

        const setP = new Set()
        for (let i = 0; i < penalties.length; i++) {
            setP.add((penalties[i] || '').toLowerCase())
        }

        let map = candidates.map(async c => {
            // is masternode
            if (signers.length === 0) {
                c.isMasternode = !!c.latestSignedBlock
            } else {
                c.isMasternode = setS.has((c.candidate || '').toLowerCase())
            }
            // is penalty
            c.isPenalty = setP.has((c.candidate || '').toLowerCase())

            c.status = (c.isMasternode) ? 'MASTERNODE' : c.status
            c.status = (c.isPenalty) ? 'SLASHED' : c.status

            return c
        })
        let ret = await Promise.all(map)

        return res.json(ret)
    } catch (e) {
        return next(e)
    }
})

router.get('/:candidate', async function (req, res, next) {
    let address = (req.params.candidate || '').toLowerCase()
    let candidate = (await db.Candidate.findOne({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: address
    }) || {})

    return res.json(candidate)
})

router.get('/:candidate/voters', async function (req, res, next) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let voters = await db.Voter.find({
        smartContractAddress: config.get('blockchain.validatorAddress'),
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

// for automation test only
router.post('/apply', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)

        web3.setProvider(walletProvider)
        let candidate = req.query.coinbase.toLowerCase()
        let isCandidate = await validator.methods.isCandidate(candidate).call()
        if (isCandidate) {
            await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate
            }, {
                $set: {
                    name: req.query.name
                }
            }, { upsert: false })
            return res.json({ status: 'OK' })
        }
        await validator.methods.propose(candidate).send({
            from : walletProvider.address,
            value: '50000000000000000000000',
            gas: 2000000,
            gasPrice: 2500
        })
        if (req.query.name) {
            await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate
            }, {
                $set: {
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: candidate,
                    capacity: '50000000000000000000000',
                    status: 'PROPOSED',
                    owner: walletProvider.address,
                    name: req.query.name
                }
            }, { upsert: true })
        }
        return res.json({ status: 'OK' })
    } catch (e) {
        return next(e)
    }
})

// for automation test only
router.post('/applyBulk', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)

        web3.setProvider(walletProvider)
        let candidates = (req.query.candidates || '').split(',')

        for (let candidate of candidates) {
            candidate = (candidate || '').trim().toLowerCase()
            try {
                let isCandidate = await validator.methods.isCandidate(candidate).call()
                if (isCandidate) continue

                await validator.methods.propose(candidate).send({
                    from : walletProvider.address,
                    value: '50000000000000000000000',
                    gas: 2000000,
                    gasPrice: 2500
                })
                if (req.query.name) {
                    await db.Candidate.updateOne({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: candidate
                    }, {
                        $set: {
                            smartContractAddress: config.get('blockchain.validatorAddress'),
                            candidate: candidate,
                            capacity: '50000000000000000000000',
                            status: 'PROPOSED',
                            owner: walletProvider.address
                        }
                    }, { upsert: true })
                }
            } catch (e) {
                logger.error(e)
            }
        }
        return res.json({ status: 'OK' })
    } catch (e) {
        return next(e)
    }
})

// for automation test only
router.post('/resign', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)

        web3.setProvider(walletProvider)

        let candidate = req.query.coinbase.toLowerCase()
        await validator.methods.resign(candidate).send({
            from : walletProvider.address,
            gas: 2000000,
            gasPrice: 2500
        })
        return res.json({ status: 'OK' })
    } catch (e) {
        return res.json({ status: 'NOK' })
    }
})

// for automation test only
router.post('/vote', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)
        let candidate = req.query.coinbase.toLowerCase()
        web3.setProvider(walletProvider)
        let ret = await validator.methods.vote(candidate).send({
            from : walletProvider.address,
            value: '500000000000000000000',
            gas: 2000000,
            gasPrice: 2500
        })
        return res.json({ status: 'OK', tx: ret.transactionHash })
    } catch (e) {
        return next(e)
    }
})

// for automation test only
router.post('/unvote', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.rpc')
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)
        let candidate = req.query.coinbase.toLowerCase()
        web3.setProvider(walletProvider)
        await validator.methods.unvote(candidate, '200000000000000000000').send({
            from : walletProvider.address,
            gas: 2000000,
            gasPrice: 2500
        })
        return res.json({ status: 'OK' })
    } catch (e) {
        return res.json({ status: 'NOK' })
    }
})

router.get('/:candidate/isMasternode', async function (req, res, next) {
    try {
        let latestSigners = await db.Signer.findOne({}).sort({ _id: 'desc' })
        const signers = latestSigners.signers
        const set = new Set()
        for (let i = 0; i < signers.length; i++) {
            set.add(signers[i])
        }
        let isMasternode = (set.has(req.params.candidate || '')) ? 1 : 0

        return res.json(isMasternode)
    } catch (e) {
        return next(e)
    }
})

router.get('/:candidate/isCandidate', async function (req, res, next) {
    try {
        let isCandidate = await validator.methods.isCandidate(req.params.candidate).call()
        return res.json((isCandidate) ? 1 : 0)
    } catch (e) {
        return next(e)
    }
})

// Get masternode rewards
router.get('/:candidate/:owner/getRewards', async function (req, res, next) {
    try {
        const candidate = req.params.candidate
        const owner = req.params.owner
        const limit = 100
        const rewards = await axios.post(
            `${config.get('tomoscanUrl')}/api/expose/rewards`,
            {
                address: candidate,
                limit,
                owner: owner,
                reason: 'MasterNode'
            }
        )
        res.json(rewards.data)
    } catch (e) {
        return next(e)
    }
})

// Update masternode info
router.put('/update', [
    check('name').isLength({ min: 3, max: 30 }).optional().withMessage('Name must be 3 - 30 chars long'),
    check('hardware').isLength({ min: 3, max: 30 }).optional().withMessage('Hardware must be 3 - 30 chars long'),
    check('dcName').isLength({ min: 2, max: 30 }).optional().withMessage('dcName must be 2 - 30 chars long'),
    check('dcLocation').isLength({ min: 2, max: 30 }).optional().withMessage('dcLocation must be 2 - 30 chars long')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const { signedMessage, message } = req.body
        const candidate = (req.body.candidate || '').toLowerCase()
        const c = await db.Candidate.findOne({
            candidate: candidate
        })
        if (!c) {
            return next(new Error('Not found'))
        }

        const body = req.body
        let set = _.pick(body, ['name', 'hardware'])

        if (body.dcName) {
            set['dataCenter.name'] = body.dcName
        }
        if (body.dcLocation) {
            set['dataCenter.location'] = body.dcLocation
        }

        const address = await web3.eth.accounts.recover(message, signedMessage)

        if (
            address.toLowerCase() === c.candidate.toLowerCase() ||
            address.toLowerCase() === c.owner.toLowerCase()
        ) {
            await db.Candidate.updateOne({
                candidate: candidate.toLowerCase()
            }, {
                $set: set
            })
            return res.json({ status: 'OK' })
        } else {
            return next(new Error('Authentication failed'))
        }
    } catch (e) {
        return next(e)
    }
})

module.exports = router
