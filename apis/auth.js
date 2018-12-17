'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const utils = require('ethereumjs-util')
const db = require('../models/mongodb')

const uuidv4 = require('uuid/v4')
const urljoin = require('url-join')

router.get('/generateLoginQR', async (req, res, next) => {
    try {
        const message = '[Tomomaster ' + (new Date().toLocaleString().replace(/['"]+/g, '')) + '] Login'
        const id = uuidv4()
        res.send({
            message,
            url: urljoin(config.get('baseUrl'), `api/auth/verifyLogin?id=${id}`),
            id
        })
    } catch (e) {
        next(e)
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
        if (sign && id === sign.signedId) {
            return res.status(406).send('Cannot use a QR code twice')
        } else {
            const data = {}
            data.signedId = id
            data.message = message
            data.signature = signature

            await db.Signature.findOneAndUpdate({ signedAddress: signedAddress }, data, { upsert: true, new: true })
        }
        return res.send('Done')
    } catch (e) {
        next(e)
    }
})

router.get('/getLoginResult', async (req, res, next) => {
    try {
        const messId = req.query.id || ''

        const signature = await db.Signature.findOne({ signedId: messId })

        if (signature) {
            return res.json({
                user: signature.signedAddress
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
