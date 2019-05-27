'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const utils = require('ethereumjs-util')
const db = require('../models/mongodb')

const uuidv4 = require('uuid/v4')
const urljoin = require('url-join')
const { check, validationResult, query } = require('express-validator/check')

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

router.post('/verifyLogin', [
    query('id').isLength({ min: 1 }).exists().withMessage('id is required')
        .contains('-').withMessage('wrong id format'),
    check('message').isLength({ min: 1 }).exists().withMessage('message is required'),
    check('signature').isLength({ min: 1 }).exists().withMessage('signature is required'),
    check('signer').isLength({ min: 1 }).exists().withMessage('signer is required')
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

        const signedAddress = (ecRecover(message, signature) || '').toLowerCase()

        if (signer !== signedAddress) {
            throw Error('The Signature Message Verification Failed')
        }

        // Store id, address, msg, signature
        let sign = await db.Signature.findOne({ signedAddress: signedAddress })
        if (sign && id === sign.signedId) {
            throw Error('Cannot use a QR code twice')
        } else {
            const data = {}
            data.signedId = id
            data.message = message
            data.signature = signature

            await db.Signature.findOneAndUpdate({ signedAddress: signedAddress }, data, { upsert: true, new: true })
        }
        return res.send('Done')
    } catch (e) {
        console.trace(e)
        console.log(e)
        return next(e)
    }
})

router.get('/getLoginResult', [
    query('id').isLength({ min: 1 }).exists().withMessage('id is required')
        .contains('-').withMessage('wrong id format')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const messId = escape(req.query.id || '')

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
