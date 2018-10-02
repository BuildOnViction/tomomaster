'use strict'

const { Validator } = require('../models/blockchain/validator')
const { BlockSigner } = require('../models/blockchain/blockSigner')
const db = require('../models/mongodb')
const BigNumber = require('bignumber.js')
const chain = require('../models/blockchain/chain')
const moment = require('moment')
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

    try {
        let validator = await Validator.deployed()
        let bs = await BlockSigner.deployed()

        let startBlockNumber = blockNumber - (2 * epoch) + 1
        let endBlockNumber = blockNumber - epoch
        let sn = await db.Signer.findOne({
            blockNumber: (startBlockNumber - 1)
        })

        // verify block was on chain
        for (let i = startBlockNumber; i <= endBlockNumber; i++) {
            let blockHash = await chain.eth.getBlock(i).hash
            let ss = await bs.getSigners.call(blockHash)
            await db.BlockSigner.updateOne({
                blockHash: blockHash,
                blockNumber: i
            }, {
                $set: {
                    blockHash: blockHash,
                    blockNumber: i,
                    snapSigners: ss
                }
            }, {
                upsert: true
            })
        }

        let signers = (sn || {}).signers || []

        console.log('Reward masternodes', signers)

        let totalReward = config.get('blockchain.reward') // TOMO
        let mnRewardRate = config.get('blockchain.masternodeRewardRate')
        let vRewardRate = config.get('blockchain.voterRewardRate')
        let fdRewardRate = config.get('blockchain.foundationRewardRate')
        let fdAddress = config.get('blockchain.foundationAddress')
        let reward = []
        let totalSign = 0
        let map = signers.map(async s => {
            let ns = await db.BlockSigner.countDocuments({
                blockNumber: { $in: Array.from(new Array(epoch), (val, index) => startBlockNumber + index) },
                'snapSigners': s
            })
            reward.push({
                address: s,
                signNumber: ns
            })
            totalSign = totalSign + ns
            return ns
        })

        await Promise.all(map)

        let fdReward = new BigNumber(0)

        let blk = await chain.eth.getBlock(blockNumber)
        let createdAt = moment.unix(blk.timestamp).utc()

        map = reward.map(async r => {
            try {
                let mn = new BigNumber(r.signNumber * totalReward).div(totalSign)
                    .multipliedBy(1e+18)

                fdReward = fdReward.plus(mn.multipliedBy(fdRewardRate).div(100))

                let mnRewardState = {
                    address: r.address,
                    reward:  mn.multipliedBy(mnRewardRate).div(100).toString()
                }

                let vh = await db.VoteHistory.findOne({
                    candidate: r.address,
                    blockNumber: {
                        $lt: blockNumber
                    }
                }).sort({ blockNumber: -1 })

                let voters = vh.voters
                let candidateCap = await validator.getCandidateCap.call(r.address)
                let owner = await validator.getCandidateOwner.call(r.address)

                let vmap = voters.map(v => {
                    let voterReward = mn.multipliedBy(new BigNumber(v.capacity))
                        .div(candidateCap).multipliedBy(vRewardRate).div(100)
                    return db.VoterReward.create({
                        address: v.address,
                        candidate: r.address,
                        reward: voterReward.toString(),
                        checkpoint: blockNumber,
                        startBlockNumber: startBlockNumber,
                        endBlockNumber: endBlockNumber,
                        voted: v.capacity.toString(),
                        signNumber: r.signNumber,
                        createdAt: createdAt
                    })
                })
                await Promise.all(vmap)
                return db.MnReward.create({
                    address: mnRewardState.address,
                    owner: owner,
                    signNumber: r.signNumber,
                    reward: mnRewardState.reward,
                    checkpoint: blockNumber,
                    startBlockNumber: startBlockNumber,
                    endBlockNumber: endBlockNumber,
                    totalSigners: signers.length,
                    createdAt: createdAt
                })
            } catch (e) {
                console.error('ERROR Reward', e)
                return done(e)
            }
        })

        await db.FdReward.create({
            address: fdAddress,
            reward: fdReward.toString(),
            checkpoint: blockNumber,
            startBlockNumber: startBlockNumber,
            endBlockNumber: endBlockNumber,
            createdAt: createdAt
        })

        await Promise.all(map)
    } catch (e) {
        console.log('ERROR Reward', e)
        done(e)
    }

    done()
}

module.exports = consumer
