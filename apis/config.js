'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const chain = require('../models/blockchain/chain')

router.get('/', async function (req, res, next) {
    let appConfig = {}
    appConfig.blockchain = config.get('blockchain')

    appConfig.blockchain.blockNumber = chain.eth.blockNumber
    appConfig.explorerUrl = config.get('explorerUrl')
    appConfig.grafanaUrl = config.get('grafanaUrl')
    appConfig.GA = config.get('GA')
    return res.json(appConfig)
})

module.exports = router
