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
    check('limit').isInt({ min: 1, max: 200 }).optional().withMessage('Wrong limit')
], async function (req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
    let skip
    if (limit > 200) {
        limit = 200
    }
    skip = (req.query.page) ? limit * (req.query.page - 1) : 0
    try {
        const total = db.Voter.countDocuments({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            voter: (req.params.voter || '').toLowerCase(),
            capacityNumber: { $ne: 0 }
        })
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
        return res.json({
            items: voters,
            total: await total
        })
    } catch (e) {
        return next(e)
    }
})

router.get('/:voter/rewards', async function (req, res, next) {
    try {
        const voter = req.params.voter
        const page = (req.query.page) ? parseInt(req.query.page) : 0
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 100
        if (limit > 100) {
            limit = 100
        }

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

        if (action !== 'withdraw' && action !== 'resign') {
            if (!candidate) {
                throw Error('candidate is required')
            }
        } else if (checkId.candidate.toLowerCase() !== candidate) {
            throw Error('candidate is not match')
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
}
)

module.exports = router
