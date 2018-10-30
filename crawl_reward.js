'use strict'

const { Validator } = require('./models/blockchain/validator')
const { BlockSigner } = require('./models/blockchain/blockSigner')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const chain = require('./models/blockchain/chain')
const db = require('./models/mongodb')
const config = require('config')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(100)

function watchNewBlock () {
    try {
        chain.eth.filter('latest').watch(async (err, block) => {
            if (err) {
                emitter.emit('error', err)
            }
            try {
                let blk = await chain.eth.getBlock('latest')
                await updateSigners(blk)
                let epoch = parseInt(config.get('blockchain.epoch'))
                let blockNumber = blk.number
                console.log('Get latest block', blockNumber)
                if (blockNumber % epoch === 0) {
                    await reward(blk)
                }
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

async function updateSigners (blk) {
    try {
        if (!blk) {
            let latestBlockNumber = await chain.eth.blockNumber
            let lastCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))
            if (lastCheckpoint > 0) {
                blk = await chain.eth.getBlock(lastCheckpoint)
            } else {
                return false
            }
        }
        let buff = Buffer.from(blk.extraData.substring(2), 'hex')
        let sbuff = buff.slice(32, buff.length - 65)
        let signers = []
        if (sbuff.length > 0) {
            for (let i = 1; i <= sbuff.length / 20; i++) {
                let address = sbuff.slice((i - 1) * 20, i * 20)
                signers.push('0x' + address.toString('hex'))
            }
            await db.Signer.create({
                networkId: config.get('blockchain.networkId'),
                blockNumber: blk.number,
                signers: signers
            })
        }
        return signers
    } catch (e) {
        console.error(e)
    }
}

async function reward (block) {
    let epoch = parseInt(config.get('blockchain.epoch'))
    let blockNumber = parseInt(block.number)

    try {
        console.log('Cal reward', blockNumber, epoch)

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

        console.log('Reward masternodes', blockNumber, blockNumber / epoch, signers)

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
                return e
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
        return e
    }
}

updateSigners(false)
watchNewBlock()
emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
