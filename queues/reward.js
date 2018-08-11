'use strict'

const { Validator } = require('../models/blockchain/validator')
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

    let validator = await Validator.deployed()

    let startBlockNumber = blockNumber - (2 * epoch)
    let endBlockNumber = blockNumber - epoch - 1
    let sn = await db.Signer.findOne({
        blockNumber: startBlockNumber
    })

    let signers = (sn || {}).signers || []

    console.log('Reward masternodes', signers)

    let totalReward = 10 // TOMO
    let mnRewardRate = 40
    let vRewardRate = 50
    // let fRewardRate = 10
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

    map = reward.map(async r => {
        let mn = (new BigNumber(r.reward || 0)).plus(r.signNumber * totalReward).div(totalSign)
            .multipliedBy(10e+18)

        let mnRewardState = {
            address: r.address,
            reward:  mn.multipliedBy(mnRewardRate / 100).toString()
        }

        let vh = await db.VoteHistory.findOne({
            candidate: r.address,
            blockNumber: {
                $lt: endBlockNumber
            }
        }).sort({ blockNumber: -1 })

        let voters = vh.voters
        let candidateCap = await validator.getCandidateCap.call(r.address)
        let owner = await validator.getCandidateOwner.call(r.address)

        let votersReward = mn.multipliedBy(vRewardRate / 100)
        let vmap = voters.map(v => {
            let voterReward = mn.multipliedBy(v.capacity).div(candidateCap).multipliedBy(votersReward)
            return db.VoterReward.create({
                address: v.address,
                candidate: r.address,
                reward: voterReward.toString(),
                checkpoint: blockNumber,
                voted: v.capacity.toString(),
                signNumber: r.signNumber
            })
        })
        await Promise.all(vmap)
        return db.MnReward.create({
            address: mnRewardState.address,
            owner: owner,
            signNumber: r.signNumber,
            reward: mnRewardState.reward,
            checkpoint: blockNumber
        })
    })

    await Promise.all(map)

    done()
}

module.exports = consumer
