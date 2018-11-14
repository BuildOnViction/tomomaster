'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const web3 = require('../models/blockchain/web3')

router.get('/', async function (req, res, next) {
    let appConfig = {}
    appConfig.blockchain = config.get('blockchain')

    appConfig.blockchain.blockNumber = web3.eth.getBlockNumber()
    appConfig.explorerUrl = config.get('explorerUrl')
    appConfig.grafanaUrl = config.get('grafanaUrl')
    appConfig.GA = config.get('GA')
    return res.json(appConfig)
})

module.exports = router
