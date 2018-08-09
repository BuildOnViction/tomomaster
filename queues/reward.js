'use strict'

/*
const web3 = require('../models/blockchain/chain')
*/
const db = require('../models/mongodb')
const config = require('config')
const consumer = {}

consumer.name = 'reward'
consumer.task = async function (job, done) {
    let block = job.data.block
    let epoch = parseInt(config.get('blockchain.epoch'))
    let blockNumber = parseInt(block.number)

    if (blockNumber % epoch !== 0) {
        return done()
    }

    /*
    let rewardEpochNumber = (blockNumber / epoch) - 1
    let rewardBlockNumber = blockNumber - epoch
    */
    let sn = await db.Signer.findOne({
        blockNumber: blockNumber - (2 * epoch)
    })

    let signers = (sn || {}).signers || []
    console.log('checkpoint !!!', signers)

    done()
}

module.exports = consumer
