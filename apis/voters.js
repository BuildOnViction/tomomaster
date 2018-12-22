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
const { check, validationResult } = require('express-validator/check')
const urljoin = require('url-join')

router.get('/:voter/candidates', [
    check('limit').isInt({ min: 1, max: 200 }).optional().withMessage('Wrong limit')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    const limit = (req.query.limit) ? parseInt(req.query.limit) : 100
    const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        let voters = await db.Voter.find({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase(),
            capacityNumber: { $ne: 0 }
        }).sort({ capacityNumber: 'desc' }).limit(limit).skip(skip).lean().exec()
        let cs = voters.map(v => v.candidate)
        let candidates = await db.Candidate.find({
            candidate: { $in: cs }
        }).lean().exec()
        voters = voters.map(v => {
            v.candidateName = (_.findLast(candidates, (c) => {
                return (c.candidate === v.candidate)
            }) || {}).name || 'Anonymous'
            return _.pick(v, ['candidate', 'capacity', 'capacityNumber', 'candidateName'])
        })
        return res.json(voters)
    } catch (e) {
        return next(e)
    }
})

router.get('/:voter/rewards', async function (req, res, next) {
    try {
        const voter = req.params.voter
        const limit = 100
        const rewards = await axios.post(
            urljoin(config.get('tomoscanUrl'), 'api/expose/rewards'),
            {
                address: voter,
                limit
            }
        )
        const cs = rewards.data.map(r => r.validator)
        const candidates = await db.Candidate.find({
            candidate: { $in: cs }
        }).lean().exec()
        const rd = rewards.data.map(r => {
            r.candidateName = (_.findLast(candidates, (c) => {
                return (c.candidate.toLowerCase() === r.validator.toLowerCase())
            }) || {}).name || r.validator
            return r
        })
        res.json(rd)
    } catch (e) {
        return next(e)
    }
})

router.post('/generateQR', async (req, res, next) => {
    try {
        const voter = req.body.voter
        const amount = req.body.amount
        const candidate = (req.body.candidate || '').toLowerCase()
        const action = req.body.action

        let candidateInfo = (await db.Candidate.findOne({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate
        }) || {})

        const candidateName = candidateInfo.name ? candidateInfo.name : 'Anonymous Candidate'

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
    check('action').isLength({ min: 1 }).withMessage('action is required'),
    check('signer').isLength({ min: 1 }).withMessage('signer is required'),
    check('rawTx').isLength({ min: 1 }).withMessage('rawTx is required')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const id = req.query.id
        const action = req.body.action
        let signer = req.body.signer
        let candidate = req.body.candidate || ''
        const amount = (req.body.amount)
            ? new BigNumber(req.body.amount.replace(/,/g, '')).toString(10)
            : undefined
        const serializedTx = req.body.rawTx

        if (!id) {
            return res.status(406).send('id is required')
        }
        if (!amount) {
            if (action !== 'resign') {
                return res.status(406).send('amount is required')
            }
        }
        const checkId = await db.SignTransaction.findOne({ signId: id })

        if (action !== 'withdraw' && action !== 'resign') {
            if (!candidate) {
                return res.status(406).send('candidate is required')
            }
        } else if (checkId && checkId.candidate !== candidate) {
            return res.status(406).send('candidate is not match')
        }
        if (checkId && !checkId.status) {
            return res.status(406).send('Cannot use a QR code twice')
        }

        if (checkId && (action !== checkId.action || id !== checkId.signId)) {
            return res.status(406).send('Wrong action')
        }
        let signedAddress = '0x' + new EthereumTx(serializedTx).getSenderAddress().toString('hex')

        signedAddress = signedAddress.toLowerCase()
        signer = signer.toLowerCase()
        candidate = candidate.toLowerCase()

        if (signedAddress !== signer || signedAddress !== checkId.signedAddress) {
            return res.status(406).send('Signed Address and signer are not match')
        }

        if (action === 'vote' || action === 'unvote' || action === 'withdraw' || action === 'propose') {
            if (checkId.amount !== amount) {
                return res.status(406).send('Amount is not match')
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
                                return res.status(406).send('Not enough TOMO')
                            } else {
                                return res.status(404).send('Something went wrong')
                            }
                        }
                    } catch (error) {
                        console.log(error)
                        next(error)
                    }
                } else next(error)
            } else {
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
            }
        })
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(404).send(e)
    }
})

router.get('/getScanningResult',
    async (req, res, next) => {
        try {
            const id = req.query.id
            const action = req.query.action || ''

            const signTx = await db.SignTransaction.findOne({ signId: id })

            if (signTx && id === signTx.signId && !signTx.status) {
                const checkTx = ((signTx || {}).tx && action === 'withdraw')
                    ? true : await db.Transaction.findOne({ tx: signTx.tx })
                if (checkTx) {
                    res.send({
                        tx: signTx.tx
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
    }
)

module.exports = router
