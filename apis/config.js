'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const web3 = require('../models/blockchain/web3rpc').Web3Rpc()

router.get('/', async function (req, res, next) {
    let appConfig = {}
    appConfig.blockchain = JSON.parse(JSON.stringify(config.get('blockchain')))

    delete appConfig.blockchain.internalRpc
    delete appConfig.blockchain.internalWs
    try {
        appConfig.blockchain.blockNumber = await web3.eth.getBlockNumber()
    } catch (e) {
        appConfig.blockchain.blockNumber = 0
    }
    appConfig.explorerUrl = config.get('explorerUrl')
    appConfig.GA = config.get('GA')
    return res.json(appConfig)
})

module.exports = router
