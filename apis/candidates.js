'use strict'
const express = require('express')
const router = express.Router()

router.get('/', function (req, res, next) {
    return res.json({})
})

module.exports = router
