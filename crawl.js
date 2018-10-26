'use strict'

const { Validator } = require('./models/blockchain/validator')
const { BlockSigner } = require('./models/blockchain/blockSigner')
const chain = require('./models/blockchain/chain')
const db = require('./models/mongodb')
const config = require('config')
const q = require('./queues')
const moment = require('moment')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(200)

async function watchBlockSigner () {
    try {
        let bs = await BlockSigner.deployed()
        let cs = await db.CrawlState.findOne({
            smartContractAddress: bs.address
        })
        let blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
        let epoch = parseInt(config.get('blockchain.epoch'))
        let latestBlockNumber = await chain.eth.blockNumber
        if (blockNumber < (latestBlockNumber - 3 * epoch)) {
            blockNumber = latestBlockNumber - 3 * epoch
        }
        console.info('BlockSigner %s - Listen events from block number %s ...', bs.address, blockNumber)
        const allEvents = bs.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        })
        allEvents.watch(async (err, res) => {
            if (err || !(res || {}).args) {
                console.error(err, res)
                return false
            }
            console.info('BlockSigner - New event %s from block %s', res.event, res.blockNumber)

            try {
                await db.CrawlState.updateOne({
                    smartContractAddress: bs.address
                }, { $set:{
                    smartContractAddress: bs.address,
                    blockNumber: res.blockNumber
                } }, { upsert: true })

                let signer = res.args._signer
                let tx = res.transactionHash
                let bN = String(res.args._blockNumber)
                let bH = String(res.args._blockHash)

                let blk = await chain.eth.getBlock(res.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()

                return db.BlockSigner.updateOne({
                    smartContractAddress: bs.address,
                    blockHash: bH
                }, {
                    $set: {
                        smartContractAddress: bs.address,
                        blockNumber: bN,
                        blockHash: bH
                    },
                    $addToSet: {
                        signers: {
                            signer: signer,
                            tx: tx,
                            createdAt: createdAt
                        }
                    }
                }, { upsert: true })
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

async function watchValidator () {
    try {
        let v = await Validator.deployed()
        let cs = await db.CrawlState.findOne({
            smartContractAddress: v.address
        })

        const blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
        console.info('TomoValidator %s - Listen events from block number %s ...', v.address, blockNumber)
        const allEvents = v.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        })

        allEvents.watch(async (err, res) => {
            if (err || !(res || {}).args) {
                console.error(err, res)
                return false
            }
            console.info('TomoValidator - New event %s from block %s', res.event, res.blockNumber)
            try {
                let event = res.event
                await db.CrawlState.updateOne({
                    smartContractAddress: v.address
                }, { $set:{
                    smartContractAddress: v.address,
                    blockNumber: res.blockNumber
                } }, { upsert: true })
                if (event === 'Withdraw') {
                    let owner = (res.args._owner || '').toLowerCase()
                    let blockNumber = res.args._blockNumber
                    let capacity = res.args._cap
                    let wd = new db.Withdraw({
                        smartContractAddress: v.address,
                        blockNumber: blockNumber,
                        tx: res.transactionHash,
                        owner: owner,
                        capacity: capacity
                    })
                    wd.save()
                    return true
                }
                let candidate = (res.args._candidate || '').toLowerCase()
                let voter = (res.args._voter || '').toLowerCase()
                let owner = (res.args._owner || '').toLowerCase()
                let capacity = res.args._cap
                let blk = await chain.eth.getBlock(res.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()
                let tx = new db.Transaction({
                    smartContractAddress: v.address,
                    tx: res.transactionHash,
                    event: event,
                    voter: voter,
                    owner: owner,
                    candidate: candidate,
                    capacity: capacity,
                    createdAt: createdAt
                })
                tx.save()
                if (event === 'Vote' || event === 'Unvote') {
                    updateVoterCap(candidate, voter)
                }
                if (event === 'Resign' || event === 'Propose') {
                    updateVoterCap(candidate, owner)
                }
                q.create('voteHistory', { candidate, blockNumber })
                    .priority('low').removeOnComplete(true).save()
                updateCandidateInfo(candidate)
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

function watchNewBlock () {
    try {
        chain.eth.filter('latest').watch(async (err, block) => {
            if (err) {
                emitter.emit('error', err)
            }
            try {
                let blk = await chain.eth.getBlock('latest')
                await updateSigners(blk)
                q.create('reward', { block: blk })
                    .priority('low').removeOnComplete(true).save()
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

async function updateCandidateInfo (candidate) {
    try {
        let validator = await Validator.deployed()
        let capacity = await validator.getCandidateCap.call(candidate)
        let owner = (await validator.getCandidateOwner.call(candidate) || '').toLowerCase()
        let status = await validator.isCandidate.call(candidate)
        let result
        console.info('Update candidate %s capacity %s', candidate, String(capacity))
        if (candidate !== '0x0000000000000000000000000000000000000000') {
            result = db.Candidate.updateOne({
                smartContractAddress: validator.address,
                candidate: candidate
            }, {
                $set: {
                    smartContractAddress: validator.address,
                    candidate: candidate,
                    capacity: String(capacity),
                    status: (status) ? 'PROPOSED' : 'RESIGNED',
                    owner: owner
                }
            }, { upsert: true })
        } else {
            result = db.Candidate.deleteOne({
                smartContractAddress: validator.address,
                candidate: candidate
            })
        }

        return result
    } catch (e) {
        console.error(e)
    }
}

async function updateVoterCap (candidate, voter) {
    try {
        let validator = await Validator.deployed()
        let capacity = await validator.getVoterCap.call(candidate, voter)
        console.log('Update voter %s for candidate %s capacity %s', voter, candidate, String(capacity))
        return db.Voter.updateOne({
            smartContractAddress: validator.address,
            candidate: candidate,
            voter: voter
        }, {
            $set: {
                smartContractAddress: validator.address,
                candidate: candidate,
                voter: voter,
                capacity: String(capacity)
            }
        }, { upsert: true })
    } catch (e) {
        console.error(e)
    }
}

// Get current candates
async function getCurrentCandidates () {
    try {
        let validator = await Validator.deployed()
        let candidates = await validator.getCandidates.call()

        let map = candidates.map(async (candidate) => {
            candidate = (candidate || '').toLowerCase()
            let voters = await validator.getVoters.call(candidate)
            let m = voters.map(v => {
                v = (v || '').toLowerCase()
                return updateVoterCap(candidate, v)
            })

            // init vote history
            q.create('voteHistory', { candidate, blockNumber: 0 })
                .priority('low').removeOnComplete(true).save()

            await Promise.all(m)
            return updateCandidateInfo(candidate)
        })
        return Promise.all(map).catch(e => console.error(e))
    } catch (e) {
        console.error(e)
    }
}

getCurrentCandidates()
updateSigners(false)
watchNewBlock()
watchBlockSigner()
watchValidator()
emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
