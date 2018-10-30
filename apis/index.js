'use strict'
const express = require('express')
const router = express.Router()

router.use('/api/candidates', require('./candidates'))
router.use('/api/voters', require('./voters'))
router.use('/api/owners', require('./owners'))
router.use('/api/config', require('./config'))
router.use('/api/signers', require('./signers'))
router.use('/api/transactions', require('./transactions'))
router.use('/api/monitor', require('./grafana'))
router.use('/api/search', require('./search'))

module.exports = router
