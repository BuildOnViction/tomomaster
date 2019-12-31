'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../models/mongodb')
const web3 = require('../models/blockchain/web3rpc').Web3RpcInternal()
const validator = require('../models/blockchain/validatorRpc')
const HDWalletProvider = require('truffle-hdwallet-provider')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const config = require('config')
const _ = require('lodash')
const logger = require('../helpers/logger')
const { check, validationResult, query } = require('express-validator/check')
const uuidv4 = require('uuid/v4')
const urljoin = require('url-join')

const gas = config.get('blockchain.gas')

router.get('/', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress')
        })
        const activeCandidates = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: { $ne: 'RESIGNED' }
        })

        const sort = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                delete sort.capacity
                sort.capacityNumber = (req.query.sortDesc === 'true') ? -1 : 1
            }
        } else {
            sort.capacityNumber = -1
        }

        let data = await Promise.all([
            db.Candidate.find({
                smartContractAddress: config.get('blockchain.validatorAddress')
            }).sort(sort).limit(limit).skip(skip).lean().exec()
        ])

        let candidates = data[0]

        let map = candidates.map(async c => {
            // is masternode
            c.isMasternode = (c.status === 'MASTERNODE' || c.status === 'SLASHED')
            return c
        })
        let ret = await Promise.all(map)

        return res.json({
            items: ret,
            total: await total,
            activeCandidates: await activeCandidates
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/masternodes', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const activeCandidates = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: { $nin: ['RESIGNED', 'PROPOSED'] }
        })

        const totalSlashed = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'SLASHED'
        })

        const totalResigned = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'RESIGNED'
        }).lean().exec()

        const totalProposed = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'PROPOSED'
        }).lean().exec()

        const sort = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                delete sort.capacity
                sort.capacityNumber = (req.query.sortDesc === 'true') ? -1 : 1
            }
        } else {
            sort.capacityNumber = -1
        }

        const candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: { $nin: ['RESIGNED', 'PROPOSED'] }
        }).sort(sort).limit(limit).skip(skip).lean().exec()

        return res.json({
            items: candidates,
            activeCandidates: await activeCandidates || 0,
            totalSlashed: await totalSlashed,
            totalResigned: await totalResigned,
            totalProposed: await totalProposed
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/slashedMNs', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'SLASHED'
        })

        const sort = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                delete sort.capacity
                sort.capacityNumber = (req.query.sortDesc === 'true') ? -1 : 1
            }
        } else {
            sort.capacityNumber = -1
        }

        const candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'SLASHED'
        }).sort(sort).limit(limit).skip(skip).lean().exec()

        return res.json({
            items: candidates,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/proposedMNs', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next(errors.array())
        }

        let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        let skip
        skip = (req.query.page) ? limit * (req.query.page - 1) : 0
        const sort = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                delete sort.capacity
                sort.capacityNumber = (req.query.sortDesc === 'true') ? -1 : 1
            }
        } else {
            sort.capacityNumber = -1
        }

        const total = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'PROPOSED'
        }).lean().exec()

        let candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'PROPOSED'
        }).sort(sort).limit(limit).skip(skip).lean().exec()

        return res.json({
            items: candidates,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/resignedMNs', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Candidate.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'RESIGNED'
        })

        const sort = {}

        if (req.query.sortBy) {
            sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
            if (req.query.sortBy === 'capacity') {
                delete sort.capacity
                sort.capacityNumber = (req.query.sortDesc === 'true') ? -1 : 1
            }
        } else {
            sort.capacityNumber = -1
        }

        const candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            status: 'RESIGNED'
        }).sort(sort).limit(limit).skip(skip).lean().exec()

        return res.json({
            items: candidates,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.post('/listByHash', [
    check('hashes').exists().withMessage('Missing hashes params')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    let hashes = req.body.hashes
    let listHash = hashes.split(',')

    try {
        let candidates = await db.Candidate.find({ candidate: { $in: listHash } })
        return res.json(candidates)
    } catch (e) {
        logger.warn('Cannot get list candidate by hash. Error %s', e)
        return next(e)
    }
})

router.get('/crawlStatus', async function (req, res, next) {
    const limit = 200
    const skip = 0
    try {
        let candidates = await db.Candidate.find({
            smartContractAddress: config.get('blockchain.validatorAddress')
        }).sort({ capacityNumber: 'desc' }).limit(limit).skip(skip).lean().exec()

        let latestSignedBlock = 0

        for (let c of candidates) {
            latestSignedBlock = (parseInt(c.latestSignedBlock || 0) > latestSignedBlock)
                ? parseInt(c.latestSignedBlock || 0)
                : latestSignedBlock
        }

        let blockNumber = await web3.eth.getBlockNumber()

        return res.json(
            (parseInt(latestSignedBlock) > parseInt(blockNumber) - 100)
        )
    } catch (e) {
        return next(e)
    }
})

router.get('/search', [
    query('query').isAscii().withMessage('query must be ascii symbols'),
    query('limit').isInt({ min: 0, max: 50 }).withMessage('limit must be number and less than 200 items per page'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
        const query = req.query.query || ''
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        let skip
        skip = (req.query.page) ? limit * (req.query.page - 1) : 0
        if (regexpAddr.test(query)) {
            const data = await db.Candidate.find({
                candidate: query
            }).limit(limit).skip(skip).lean().exec()
            return res.json({
                items: data
            })
        } else {
            const total = db.Candidate.count({
                name: { $regex: query, $options: 'i' }
            })
            const data = await db.Candidate.find({
                name: { $regex: query, $options: 'i' }
            }).limit(limit).skip(skip).lean().exec()
            return res.json({
                total: await total,
                items: data
            })
        }
    } catch (e) {
        return next(e)
    }
})

router.get('/:candidate', async function (req, res, next) {
    let address = (req.params.candidate || '').toLowerCase()
    let candidate = (await db.Candidate.findOne({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: address
    }).lean().exec() || {})

    let latestSigners = await db.Signer.findOne({}).sort({ _id: 'desc' })
    let latestPenalties = await db.Penalty.findOne({}).sort({ epoch: 'desc' }).lean().exec()
    // Get slashed times in a week
    const epochsPerWeek = 336
    const promise = db.Status.find({
        candidate: address
    }).sort({ epoch: -1 }).limit(epochsPerWeek).lean().exec() || 0

    let signers = (latestSigners || {}).signers || []
    let penalties = (latestPenalties || {}).penalties || []

    const setS = new Set()
    for (let i = 0; i < signers.length; i++) {
        setS.add((signers[i] || '').toLowerCase())
    }

    const setP = new Set()
    for (let i = 0; i < penalties.length; i++) {
        setP.add((penalties[i] || '').toLowerCase())
    }

    if (signers.length === 0) {
        candidate.isMasternode = !!candidate.latestSignedBlock
    } else {
        candidate.isMasternode = setS.has((candidate.candidate || '').toLowerCase())
    }

    candidate.isPenalty = setP.has((candidate.candidate || '').toLowerCase())

    const statusInWeek = await promise

    const slashedInWeek = statusInWeek.filter(s => s.status === 'SLASHED')

    candidate.slashedTimes = slashedInWeek.length || 0

    return res.json(candidate)
})

router.get('/:candidate/voters', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip

    skip = (req.query.page) ? limit * (req.query.page - 1) : 0

    let total = db.Voter.countDocuments({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: (req.params.candidate || '').toLowerCase(),
        capacityNumber: { $ne: 0 }
    })

    const sort = {}
    if (req.query.sortBy) {
        sort[req.query.sortBy] = (req.query.sortDesc === 'true') ? -1 : 1
    } else {
        sort.capacityNumber = -1
    }

    let voters = await db.Voter.find({
        smartContractAddress: config.get('blockchain.validatorAddress'),
        candidate: (req.params.candidate || '').toLowerCase(),
        capacityNumber: { $ne: 0 }
    }).sort(sort).limit(limit).skip(skip)
    return res.json({
        items: await voters,
        total: await total
    })
})
// deprecated
router.get('/:candidate/rewards', async function (req, res, next) {
    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    if (limit > 200) {
        limit = 200
    }
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    let rewards = await db.MnReward.find({
        address: (req.params.candidate || '').toLowerCase()
    }).sort({ _id: -1 }).limit(limit).skip(skip)
    return res.json(rewards)
})

// for automation test only
router.post('/apply', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.internalRpc')
    const gasPrice = await web3.eth.getGasPrice()
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
                candidate: candidate,
                owner: walletProvider.address
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
            gas,
            gasPrice
        })
        if (req.query.name) {
            await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate,
                owner: walletProvider.address
            }, {
                $set: {
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: candidate,
                    nodeId: (candidate || '').replace('0x', ''),
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
    let network = config.get('blockchain.internalRpc')
    const gasPrice = await web3.eth.getGasPrice()
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
                    gas,
                    gasPrice
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
    let network = config.get('blockchain.internalRpc')
    const gasPrice = await web3.eth.getGasPrice()
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)

        web3.setProvider(walletProvider)

        let candidate = req.query.coinbase.toLowerCase()
        await validator.methods.resign(candidate).send({
            from : walletProvider.address,
            gas,
            gasPrice
        })
        return res.json({ status: 'OK' })
    } catch (e) {
        return res.json({ status: 'NOK' })
    }
})

// for automation test only
router.post('/vote', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.internalRpc')
    const gasPrice = await web3.eth.getGasPrice()
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
            gas,
            gasPrice
        })
        return res.json({ status: 'OK', tx: ret.transactionHash })
    } catch (e) {
        return next(e)
    }
})

// for automation test only
router.post('/unvote', async function (req, res, next) {
    let key = req.query.key
    let network = config.get('blockchain.internalRpc')
    const gasPrice = await web3.eth.getGasPrice()
    try {
        let walletProvider =
            (key.indexOf(' ') >= 0)
                ? new HDWalletProvider(key, network)
                : new PrivateKeyProvider(key, network)
        let candidate = req.query.coinbase.toLowerCase()
        web3.setProvider(walletProvider)
        await validator.methods.unvote(candidate, '200000000000000000000').send({
            from : walletProvider.address,
            gas,
            gasPrice
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
router.get('/:candidate/:owner/getRewards', [
    query('limit')
        .isInt({ min: 0, max: 100 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500')
], async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next(errors.array())
        }

        const candidate = req.params.candidate
        const owner = req.params.owner

        const latestBlockNumber = await web3.eth.getBlockNumber()
        const latestCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))
        const currentEpoch = (parseInt(latestCheckpoint / config.get('blockchain.epoch')) + 1).toString()

        let limit = (req.query.limit) ? parseInt(req.query.limit) : 100
        const page = parseInt(req.query.page) || 1
        let skip
        skip = (page) ? limit * (page - 1) : 0
        let masternodesRW = []

        const total = db.Status.estimatedDocumentCount({
            candidate: candidate,
            epoch: {
                $lte: currentEpoch - 2
            }
        })

        const epochData = await db.Status.find({
            candidate: candidate,
            epoch: {
                $lte: currentEpoch - 2
            }
        }).sort({ epoch: -1 }).limit(limit).skip(skip).lean().exec()
        let masternodesEpochs = []

        epochData.map(e => {
            if (e.status === 'MASTERNODE') {
                masternodesEpochs.push(e.epoch)
            }
        })

        let masternodes = epochData.filter(e => e.status === 'MASTERNODE')
        const rewards = await axios.post(
            urljoin(config.get('tomoscanUrl'), 'api/expose/MNRewardsByEpochs'),
            {
                address: candidate,
                owner: owner,
                reason: 'Voter',
                epoch: masternodesEpochs
            }
        )

        if (rewards.data && rewards.data.length > 0) {
            const rwData = rewards.data
            masternodesRW = rwData.map((r) => {
                const mn = masternodes.find(m => m.epoch === r.epoch) || {}
                r.status = 'MASTERNODE'
                if (!r.reward) {
                    r.rewardTime = mn.epochCreatedAt || ''
                }
                if (currentEpoch - r.epoch < 2) {
                    r.masternodeReward = '-'
                    r.signNumber = '-'
                }
                return r
            })
        }

        let noRewardEpochs = epochData.filter(e => e.status !== 'MASTERNODE')

        if (noRewardEpochs.length > 0) {
            noRewardEpochs = noRewardEpochs.map(n => {
                n.masternodeReward = 0
                n.rewardTime = n.epochCreatedAt
                n.signNumber = 0
                return n
            })
        }
        const items = masternodesRW.concat(noRewardEpochs)
        return res.json({
            items: items,
            total: await total
        })
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
            smartContractAddress: config.get('blockchain.validatorAddress'),
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

        set['socials.website'] = body.website || ''
        set['socials.telegram'] = body.telegram || ''

        const address = await web3.eth.accounts.recover(message, signedMessage)

        if (
            address.toLowerCase() === c.candidate.toLowerCase() ||
            address.toLowerCase() === c.owner.toLowerCase()
        ) {
            if (c.name) {
                const currentBlockNumber = await web3.eth.getBlockNumber()
                const data = set
                data.candidate = candidate.toLowerCase()
                data.blockNumber = currentBlockNumber

                await db.History.updateOne({
                    candidate: candidate.toLowerCase(), blockNumber: currentBlockNumber
                }, {
                    $set: data
                }, { upsert: true })
            }
            await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: candidate.toLowerCase()
            }, {
                $set: set
            })
            await db.Signature.updateOne({
                signedAddress: address.toLowerCase()
            }, {
                $set: {
                    signature: ''
                }
            })
            return res.json({ status: 'OK' })
        } else {
            return res.json({
                error: {
                    message: 'Authentication failed'
                }
            })
        }
    } catch (e) {
        return next(e)
    }
})

router.post('/:candidate/generateMessage', [
    check('candidate').isLength({ min: 1 }).exists().withMessage('candidate is required'),
    check('account').isLength({ min: 1 }).exists().withMessage('account is required')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const candidate = req.params.candidate
        const account = (req.body.account || '').toLowerCase()

        const c = await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate
        })
        if (!c) {
            return res.status(406).send('This address is not a candidate')
        }

        const message = '[Tomomaster ' + (new Date().toLocaleString().replace(/['"]+/g, '')) + ']' +
            ' I am the owner of candidate ' + '[' + candidate + ']'
        const id = uuidv4()

        // update id, status
        const data = {
            signedId: id,
            status: true
        }
        await db.Signature.findOneAndUpdate({ signedAddress: account }, data, { upsert: true, new: true })

        return res.json({
            message,
            url: urljoin(config.get('baseUrl'), `api/candidates/verifyScannedQR?id=${id}`),
            id
        })
    } catch (error) {
        next(error)
    }
})

router.post('/verifyScannedQR', [
    query('id').isLength({ min: 1 }).exists().withMessage('id is required')
        .contains('-').withMessage('wrong id format'),
    check('message').isLength({ min: 1 }).exists().withMessage('message is required'),
    check('signature').isLength({ min: 1 }).exists().withMessage('signature is required'),
    check('signer').isLength({ min: 1 }).exists().withMessage('signer is required'),
    check('message').isLength({ min: 1 }).exists().withMessage('message is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const message = req.body.message
        const signature = req.body.signature
        const id = escape(req.query.id)
        let signer = req.body.signer.toLowerCase()

        const checkId = await db.Signature.findOne({ signedId: id })
        if (!checkId) {
            throw Error('id is not match')
        }
        if (!checkId.status) {
            throw Error('Cannot use a QR code twice')
        }

        const signedAddress = (await web3.eth.accounts.recover(message, signature) || '').toLowerCase()

        if (signer !== signedAddress || checkId.signedAddress !== signedAddress ||
            id !== checkId.signedId) {
            throw Error('The Signature Message Verification Failed')
        }

        // Store id, address, msg, signature
        const data = {}
        data.signedId = id
        data.message = message
        data.signature = signature
        data.status = false

        await db.Signature.findOneAndUpdate({ signedAddress: signedAddress }, data, { upsert: true, new: true })

        return res.send('Done')
    } catch (e) {
        console.trace(e)
        console.log(e)
        return next(e)
    }
})

router.get('/:candidate/getSignature', [
    query('id').isLength({ min: 1 }).exists().withMessage('id is required')
        .contains('-').withMessage('wrong id format')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const messId = escape(req.query.id)

        const signature = await db.Signature.findOne({ signedId: messId })

        if (signature && !signature.status) {
            return res.json({
                signature: signature.signature
            })
        } else {
            return res.send({
                error: {
                    message: 'No data'
                }
            })
        }
    } catch (e) {
        next(e)
    }
})

router.get('/:candidate/:owner/isOwner', async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const isOwner = await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            owner: (req.params.owner || '').toLowerCase(),
            candidate: (req.params.candidate || '').toLowerCase()
        })
        if (isOwner) {
            return res.send(true)
        } else return res.send(false)
    } catch (e) {
        next(e)
    }
})

router.get('/slashed/:epoch', [
    check('epoch').isLength({ min: 1 }).exists().withMessage('Epoch is required')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        let epoch = req.params.epoch
        let response = {
            epoch,
            penalties: [],
            networkId: config.get('blockchain.networkId')
        }
        let penalty
        penalty = await db.Penalty.findOne({ epoch: epoch })
        if (penalty && penalty.penalties.length > 0) {
            response = penalty
        } else {
            penalty = await db.Status.find({ epoch: epoch, status: 'SLASHED' })
            if (penalty.length > 0) {
                await Promise.all(penalty.map(p => {
                    response.penalties.push(p.candidate)
                }))
            }
        }

        return res.json(response)
    } catch (e) {
        return next(e)
    }
})

router.get('/:candidate/slashedFilter', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true })
        .optional().isInt({ min: 0, max: 500 }).withMessage('page should greater than 0 and less than 500'),
    check('filterBy').isLength({ min: 1 }).exists().withMessage('filterBy is required')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        let skip
        skip = (req.query.page) ? limit * (req.query.page - 1) : 0
        const filterBy = req.query.filterBy
        const candidate = req.params.candidate

        let current = new Date()
        const today = new Date()

        let totalEpochs, epochs, fromTime

        switch (filterBy) {
        case 'week':
            const aWeekAgo = new Date(current.setDate(current.getDate() - 7))
            fromTime = aWeekAgo
            break
        case 'month':
            const aMonthAgo = new Date(current.setMonth(current.getMonth() - 1))
            fromTime = aMonthAgo
            break
        case 'year':
            const aYearAgo = new Date(current.setFullYear(current.getFullYear() - 1))
            fromTime = aYearAgo
            break
        default:
            fromTime = new Date(current.setDate(current.getDate() - 7))
            break
        }

        totalEpochs = await db.Status.countDocuments({
            candidate: candidate.toLowerCase(),
            status: 'SLASHED',
            epochCreatedAt: {
                $gte: fromTime,
                $lt: today
            }
        }).lean().exec()
        epochs = await db.Status.find({
            candidate: candidate.toLowerCase(),
            status: 'SLASHED',
            epochCreatedAt: {
                $gte: fromTime,
                $lt: today
            }
        }).sort({ epoch: -1 }).limit(limit).skip(skip).lean().exec()

        Promise.all(epochs.map(e => {
            e.rewardTime = e.epochCreatedAt
        })).catch(e => console.log(e))

        return res.json({
            items: epochs,
            total: totalEpochs,
            from: fromTime,
            to: today
        })
    } catch (e) {
        return next(e)
    }
})

module.exports = router
