'use strict'
const express = require('express')
const router = express.Router()

router.use('/api/candidates', require('./candidates'))
router.use('/api/voters', require('./voters'))

module.exports = router
