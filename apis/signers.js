'use strict'
const express = require('express')
const router = express.Router()
const db = require('../models/mongodb')

router.get('/get/latest', async function (req, res, next) {
    let signer = await db.Signer.findOne({}).sort({ _id: 'desc' })
    return res.json(signer)
})

module.exports = router
