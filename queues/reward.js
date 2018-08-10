'use strict'

/*
const web3 = require('../models/blockchain/chain')
*/
const db = require('../models/mongodb')
const BigNumber = require('bignumber.js')
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
    let startBlockNumber = blockNumber - (2 * epoch)
    // let endBlockNumber = blockNumber - epoch - 1
    let sn = await db.Signer.findOne({
        blockNumber: startBlockNumber
    })

    let signers = (sn || {}).signers || []

    console.log('checkpoint !!!', signers)

    let mnReward = 40
    // let vReward = 50
    // let fReward = 10
    let reward = []
    let totalSign = 0
    let map = signers.map(async s => {
        let ns = await db.BlockSigner.count({
            blockNumber: { $in: Array.from(new Array(epoch), (val, index) => startBlockNumber + index + 1) },
            'signers.signer': s
        })
        reward.push({
            address: s,
            signNumber: ns
        })
        totalSign = totalSign + ns
        return ns
    })

    await Promise.all(map)
    reward.forEach(r => {
        r.reward = (new BigNumber(r.reward || 0)).plus(r.signNumber * mnReward).div(totalSign)
            .multipliedBy(10e+18).toString()
    })
    console.log(reward)

    done()
}

module.exports = consumer
