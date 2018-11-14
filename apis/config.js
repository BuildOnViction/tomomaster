'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const chain = require('../models/blockchain/chain')
const utils = require('ethereumjs-util')
const db = require('../models/mongodb')

const uuidv4 = require('uuid/v4')

router.get('/', async function (req, res, next) {
    let appConfig = {}
    appConfig.blockchain = config.get('blockchain')

    appConfig.blockchain.blockNumber = chain.eth.blockNumber
    appConfig.explorerUrl = config.get('explorerUrl')
    appConfig.grafanaUrl = config.get('grafanaUrl')
    appConfig.GA = config.get('GA')
    return res.json(appConfig)
})

router.get('/generateLoginQR', async (req, res, next) => {
    try {
        const message = '[Tomomaster ' + (new Date().toLocaleString().replace(/['"]+/g, '')) + '] Login'
        res.send({
            message,
            url: `${config.get('baseUrl')}api/config/verifyLogin?id=`,
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

router.post('/verifyLogin', async (req, res, next) => {
    try {
        const message = req.body.message
        const signature = req.body.signature
        const id = req.query.id
        let signer = req.body.signer

        if (!message || !signature || !id || !signer) {
            return res.status(406).send('id, message, signature and signer are required')
        }
        signer = signer.toLowerCase()

        const signedAddress = ecRecover(message, signature)

        if (signer !== signedAddress) {
            return res.status(401).send('The Signature Message Verification Failed')
        }

        // Store id, address, msg, signature
        let sign = await db.Signature.findOne({ signedAddress: signedAddress })
        if (id === sign.signedId) {
            res.status(406).send('Cannot use a QR code twice')
        } else {
            const data = {}
            data.signedId = id
            data.message = message
            data.signature = signature

            await db.Signature.findOneAndUpdate({ signedAddress: signedAddress }, data, { upsert: true, new: true })
        }
        res.send('Done')
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send(e)
    }
})

router.post('/getLoginResult', async (req, res, next) => {
    try {
        const messId = req.body.messId || ''

        const signature = await db.Signature.findOne({ signedId: messId })

        if (signature) {
            res.json({
                user: signature.signedAddress
            })
        } else {
            res.send({
                error: {
                    message: 'No data'
                }
            })
        }
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})
// Get signed address
function ecRecover (message, signature) {
    const signatureBuffer = utils.toBuffer(signature)
    const signatureParams = utils.fromRpcSig(signatureBuffer)

    const m = utils.toBuffer(message)
    const msgHash = utils.hashPersonalMessage(m)

    const publicKey = utils.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
    )
    const addressBuffer = utils.publicToAddress(publicKey)
    return utils.bufferToHex(addressBuffer)
}

module.exports = router
