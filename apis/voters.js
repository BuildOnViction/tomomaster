'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../models/mongodb')
const uuidv4 = require('uuid/v4')
const config = require('config')
const web3 = require('../models/blockchain/web3rpc')
const EthereumTx = require('ethereumjs-tx')
const BigNumber = require('bignumber.js')
const _ = require('lodash')
const { check, validationResult, query } = require('express-validator/check')
const urljoin = require('url-join')

router.get('/:voter/candidates', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true }).optional().withMessage('page must be number')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }

    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Voter.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase(),
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
            voter: (req.params.voter || '').toLowerCase(),
            capacityNumber: { $ne: 0 }
        }).sort(sort).limit(limit).skip(skip).lean().exec()

        let cs = voters.map(v => v.candidate)

        let candidates = await db.Candidate.find({
            candidate: { $in: cs }
        }).lean().exec()

        voters = voters.map(v => {
            let it = (_.findLast(candidates, (c) => {
                return (c.candidate === v.candidate)
            }) || {})
            v.candidateName = it.name || 'Anonymous'
            v.totalCapacity = it.capacity
            v.status = it.status
            v.owner = it.owner
            return _.pick(v, ['candidate', 'capacity', 'capacityNumber', 'totalCapacity',
                'candidateName', 'status', 'owner'])
        })
        return res.json({
            items: voters,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/:voter/rewards', [
    query('limit')
        .isInt({ min: 0, max: 100 }).optional().withMessage('limit should greater than 0 and less than 200'),
    query('page').isNumeric({ no_symbols: true }).optional().withMessage('page must be number')
], async function (req, res, next) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next(errors.array())
        }

        const voter = req.params.voter
        const page = (req.query.page) ? parseInt(req.query.page) : 1
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 100

        const rewards = await axios.post(
            urljoin(config.get('tomoscanUrl'), 'api/expose/rewards'),
            {
                address: voter,
                limit,
                page: page
            }
        )

        const cs = rewards.data.items.map(r => r.validator)
        const candidates = await db.Candidate.find({
            candidate: { $in: cs }
        }).lean().exec()
        const rd = rewards.data.items.map(r => {
            r.candidateName = (_.findLast(candidates, (c) => {
                return (c.candidate.toLowerCase() === r.validator.toLowerCase())
            }) || {}).name || r.validator
            return r
        })
        res.json({
            items: rd,
            total: rewards.data.total
        })
    } catch (e) {
        return next(e)
    }
})

router.post('/generateQR', [
    check('voter').isLength({ min: 1 }).withMessage('voter is required'),
    check('amount').isLength({ min: 1 }).withMessage('amount is required'),
    check('candidate').isLength({ min: 1 }).withMessage('candidate is required'),
    check('action').isLength({ min: 1 }).withMessage('action is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const voter = req.body.voter.toLowerCase()
        const amount = req.body.amount
        const candidate = req.body.candidate.toLowerCase()
        const action = req.body.action

        let candidateInfo = (await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate
        }) || {})

        const candidateName = candidateInfo.name ? candidateInfo.name : 'Anonymous'

        const message = voter + ' ' + action + ' ' + amount + ' TOMO for candidate ' + candidate + ' - ' + candidateName
        const id = uuidv4()

        const signData = {
            signId: id,
            action,
            amount,
            candidate,
            status: true
        }

        await db.SignTransaction.findOneAndUpdate(
            { signedAddress: voter },
            signData,
            { upsert: true, new: true }
        )

        res.send({
            candidateName: candidateName,
            message: (action === 'resign') ? '' : message,
            url: urljoin(config.get('baseUrl'), `api/voters/verifyTx?id=${id}`),
            id
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

router.post('/verifyTx', [
    query('id').exists().withMessage('is is required'),
    check('action').isLength({ min: 1 }).exists().withMessage('action is required'),
    check('signer').isLength({ min: 1 }).exists().withMessage('signer is required'),
    check('rawTx').isLength({ min: 1 }).exists().withMessage('rawTx is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const id = req.query.id
        const action = req.body.action
        let signer = (req.body.signer || '').toLowerCase()
        let candidate = (req.body.candidate || '').toLowerCase()
        const amount = (req.body.amount)
            ? new BigNumber(req.body.amount.replace(/,/g, '')).toString(10)
            : undefined
        const serializedTx = req.body.rawTx
        if (!amount) {
            if (action !== 'resign') {
                throw new Error('amount is required')
            }
        }

        const checkId = await db.SignTransaction.findOne({ signId: id })

        if (!checkId) {
            throw Error('id is not match, wrong qr code')
        }

        if (action !== 'withdraw') {
            if (!candidate) {
                throw Error('candidate is required')
            } else if (checkId.candidate.toLowerCase() !== candidate) {
                throw Error('candidate is not match')
            }
        }
        if (!checkId.status) {
            throw Error('Cannot use a QR code twice')
        }

        if (action !== checkId.action || id !== checkId.signId) {
            throw Error(`Wrong action, ${action} in stead of ${checkId.action}`)
        }

        let signedAddress = '0x' + new EthereumTx(serializedTx).getSenderAddress().toString('hex')

        signedAddress = signedAddress.toLowerCase()

        if (signedAddress !== signer || signedAddress !== checkId.signedAddress) {
            throw Error('Signed Address and signer are not match')
        }

        if (action !== 'resign') {
            if (checkId.amount !== amount) {
                throw Error('Amount is not match')
            }
        }

        web3.eth.sendSignedTransaction(serializedTx, async (error, hash) => {
            if (error) {
                if (action === 'vote') {
                    try {
                        const balance = await web3.eth.getBalance(signedAddress)
                        if (balance) {
                            const convertedBalanc = new BigNumber(balance).div(10 ** 18)
                            const convertedAmount = new BigNumber(amount)

                            if (convertedBalanc.isLessThan(convertedAmount)) {
                                throw Error('Not enough TOMO')
                            } else {
                                throw Error('Something went wrong')
                            }
                        }
                    } catch (error) {
                        console.trace(error)
                        console.log(error)
                        return next(error)
                    }
                } else next(error)
            } else {
                try {
                    // Store id, address, msg, signature
                    let sign = await db.SignTransaction.findOne({ signedAddress: signedAddress })
                    if (!sign) {
                        sign = {}
                    }
                    sign.action = action
                    sign.signId = id
                    sign.amount = amount
                    sign.candidate = candidate
                    sign.tx = hash
                    sign.status = false

                    await db.SignTransaction.findOneAndUpdate(
                        { signedAddress: signedAddress },
                        sign,
                        { upsert: true, new: true }
                    )
                    return res.send({
                        status: 'Done',
                        transactionHash: hash
                    })
                } catch (error) {
                    console.trace(error)
                    console.log(error)
                    return next(error)
                }
            }
        })
    } catch (e) {
        console.trace(e)
        console.log(e)
        return next(e)
    }
})

router.get('/getScanningResult', [
    query('id').exists().withMessage('id is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const id = req.query.id

        const signTx = await db.SignTransaction.findOne({ signId: id })

        if (signTx && id === signTx.signId && !signTx.status) {
            const checkTx = await web3.eth.getTransactionReceipt(signTx.tx)
            // const checkTx = ((signTx || {}).tx && action === 'withdraw')
            //     ? true : await db.Transaction.findOne({ tx: signTx.tx })
            if (checkTx) {
                res.send({
                    tx: signTx.tx,
                    status: checkTx.status
                })
            } else {
                res.send('Scanned, getting transaction hash')
            }
        } else {
            res.send({
                error: {
                    message: 'Not match'
                }
            })
        }
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send(e)
    }
})

router.get('/calculatingReward1Day', [], async (req, res, next) => {
    try {
        // candidate
        const address = (req.query.candidate || '').toLowerCase()
        // amount
        const amount = new BigNumber(req.query.amount || 0)

        // search candidate
        const candidatePromise = db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: address
        })

        let current = new Date()
        let yesterday = new Date(current.setDate(current.getDate() - 1))
        const theDayBeforeYes = new Date(current.setDate(current.getDate() - 1))

        const epochIn1Day = db.Status.count({
            candidate: address,
            epochCreatedAt: {
                $gte: theDayBeforeYes,
                $lt: yesterday
            }
        })

        const candidate = await candidatePromise

        // get latest reward
        const rewards = await axios.post(
            urljoin(config.get('tomoscanUrl'), 'api/expose/rewards'),
            {
                address: address,
                limit: 1,
                page: 1,
                owner: candidate.owner,
                reason: 'Voter'
            }
        )
        let signNumber = 0
        let epoch
        if (rewards.data.items.length > 0) {
            signNumber = rewards.data.items[0].signNumber
            epoch = rewards.data.items[0].epoch
        }

        const capacity = new BigNumber(candidate.capacity).div(10 ** 18)
        const totalReward = new BigNumber(config.get('blockchain.reward'))
        // get total signers in latest epoch
        let totalSigners
        if (epoch) {
            totalSigners = await axios.post(
                urljoin(config.get('tomoscanUrl'), `api/expose/totalSignNumber/${epoch}`)
            )
        }

        if (totalSigners && totalSigners.data && totalSigners.data.totalSignNumber) {
            // calculate devided reward
            const masternodeReward = totalReward.multipliedBy(signNumber).dividedBy(totalSigners.data.totalSignNumber)

            // calculate voter reward 1 day
            const estimateReward = masternodeReward.multipliedBy(0.5)
                .multipliedBy(amount).div(capacity.plus(amount)).multipliedBy(await epochIn1Day) || 'N/A'
            return res.send(estimateReward.toString(10))
        }
        return res.send('N/A')
    } catch (error) {
        return next(error)
    }
})

module.exports = router
