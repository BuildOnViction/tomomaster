'use strict'
const express = require('express')
const router = express.Router()

router.use('/api/candidates', require('./candidates'))

module.exports = router
