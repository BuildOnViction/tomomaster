'use strict'
const express = require('express')
const axios = require('axios')
const router = express.Router()
const db = require('../models/mongodb')
const { Validator } = require('../models/blockchain/validator')
const uuidv4 = require('uuid/v4')
const config = require('config')
const chain = require('../models/blockchain/chain')
const EthereumTx = require('ethereumjs-tx')
const BigNumber = require('bignumber.js')

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
        const action = req.body.action

        let validator = await Validator.deployed()
        let candidateInfo = (await db.Candidate.findOne({
            smartContractAddress: validator.address,
            candidate: candidate
        }) || {})

        const candidateName = candidateInfo.name ? candidateInfo.name : 'Anonymous Candidate'

        const message = voter + ' ' + action + ' ' + amount + ' TOMO for candidate ' + candidate + ' - ' + candidateName

        res.send({
            candidateName: candidateName,
            message,
            url: `${config.get('baseUrl')}api/voters/verifyTx?id=`,
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

router.post('/verifyTx', async (req, res, next) => {
    try {
        const id = req.query.id
        const action = req.body.action
        let signer = req.body.signer
        let candidate = req.body.candidate
        const amount = !isNaN(req.body.amount) ? parseInt(req.body.amount) : undefined
        const serializedTx = req.body.rawTx
        if (!id) {
            res.status(406).send()
        }
        if (!action) {
            res.status(406).send('action is requried')
        }
        if (!signer) {
            res.status(406).send('signer is requried')
        }
        if (!candidate) {
            res.status(406).send('candidate is requried')
        }
        if (!amount) {
            res.status(406).send('amount is requried')
        }
        if (!serializedTx) {
            res.status(406).send('raw transaction hash(rawTx) is requried')
        }
        const checkId = await db.SignTransaction.findOne({ signId: id })
        if (checkId) {
            res.status(406).send('Cannot use 1 QR code twice')
        }

        let voter = '0x' + new EthereumTx(serializedTx).getSenderAddress().toString('hex')

        voter = voter.toLowerCase()
        signer = signer.toLowerCase()
        candidate = candidate.toLowerCase()

        if (voter !== signer) {
            return res.status(406).send('Voter and signer are not match')
        }

        await chain.eth.sendRawTransaction(serializedTx, async (error, hash) => {
            if (error) {
                if (action === 'vote') {
                    chain.eth.getBalance(voter, function (e, balance) {
                        if (!e) {
                            if (new BigNumber(balance).div(10 ** 18) < amount) {
                                return res.status(406).send('Not enough TOMO')
                            } else {
                                return res.status(404).send('Something went wrong')
                            }
                        }
                    })
                }
                throw error
            } else {
                // Store id, address, msg, signature
                let sign = await db.SignTransaction.findOne({ signedAddress: voter })
                if (!sign) {
                    sign = {}
                }
                sign.action = action
                sign.signId = id
                sign.amount = amount
                sign.rawTx = serializedTx
                sign.candidate = candidate
                sign.tx = hash

                await db.SignTransaction.findOneAndUpdate({ signedAddress: voter }, sign, { upsert: true, new: true })
                res.send({
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

router.post('/getVotingResult', async (req, res, next) => {
    const id = req.body.id
    const voter = req.body.voter

    const acc = await db.Voter.findOne({ voter: voter })

    if (!acc) {
        return res.status(404).send()
    }
    const signTx = await db.SignTransaction.findOne({ signedAddress: voter })
    const checkTx = await db.Transaction.findOne({ tx: signTx.tx })
    if (id === signTx.signId && voter === signTx.signedAddress && checkTx) {
        res.json({
            tx: signTx.tx
        })
    } else {
        res.send({
            error: {
                message: 'Not match'
            }
        })
    }
})

router.post('/createRawTx', async (req, res, next) => {
    try {
        const value = new BigNumber(req.body.voteValue).multipliedBy(10 ** 18).toNumber()
        const gasPrice = 2500
        const gas = 1000000

        await chain.eth.getTransactionCount(
            '0x33c2e732ae7dce8b05f37b2ba0cfe14c980c4dbe'
            , function (error, lastCount) {
                if (error) {
                    console.log(error)
                }
                console.log(`lastCount
                
                
                
                
                ${lastCount}`)

                const data = '0x02aa9be2000000000000000000000000fc5571921c6d3672e13b58ea23dea534f' +
                        '2b35fa00000000000000000000000000000000000000000000000000de0b6b3a7640000'

                const rawTx = {
                    nonce: '0x' + lastCount.toString(16),
                    gasPrice,
                    gasLimit: gas,
                    value,
                    to: '0x0000000000000000000000000000000000000088',
                    data: data
                }
                const tx = new EthereumTx(rawTx)

                const privateKey = Buffer
                    .from('45a59296bfdb8f88bcd1e99c28bc1b0e294e394062e6bad340b410c343781dd3', 'hex')

                tx.sign(privateKey)
                const raw = tx.serialize().toString('hex')
                console.log(raw)
                return res.send({
                    message: 'xong',
                    raw: raw
                })
            })
    } catch (error) {
        console.log(error)
    }
})

module.exports = router
