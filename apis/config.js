'use strict'
const express = require('express')
const config = require('config')
const router = express.Router()
const db = require('../models/mongodb')
const { BlockSigner } = require('../models/blockchain/blockSigner')

router.get('/', async function (req, res, next) {
    let appConfig = {}
    appConfig.blockchain = config.get('blockchain')
    let bS = await BlockSigner.deployed()
    let blockSigner = await db.BlockSigner.findOne({
        smartContractAddress: bS.address
    }).sort({ createdAt: 'desc' })

    if (blockSigner) {
        appConfig.blockchain.blockNumber = blockSigner.blockNumber
    }
    appConfig.explorerUrl = config.get('explorerUrl')
    appConfig.grafanaUrl = config.get('grafanaUrl')
    return res.json(appConfig)
})

module.exports = router
