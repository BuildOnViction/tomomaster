'use strict'

const { Validator } = require('./models/blockchain/validator')
const { BlockSigner } = require('./models/blockchain/blockSigner')
const config = require('config')
const chain = require('./models/blockchain/chain')
const db = require('./models/mongodb')
const q = require('./queues')
const moment = require('moment')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(100)

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
                    .priority('high').removeOnComplete(true).save()
                updateCandidateInfo(candidate)
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
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

async function watchBlockSigner () {
    try {
        let bs = await BlockSigner.deployed()
        let cs = await db.CrawlState.findOne({
            smartContractAddress: bs.address
        })
        let blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
        let epoch = parseInt(config.get('blockchain.epoch'))
        let latestBlockNumber = await chain.eth.blockNumber
        let validator = await Validator.deployed()

        if (blockNumber < (latestBlockNumber - 1 * epoch)) {
            blockNumber = latestBlockNumber - 1 * epoch
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
                let bN = String(res.args._blockNumber)

                await db.Candidate.updateOne({
                    smartContractAddress: validator.address,
                    candidate: signer.toLowerCase()
                }, {
                    $set: {
                        latestSignedBlock: bN
                    }
                }, { upsert: false })
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

watchBlockSigner()

getCurrentCandidates().then(() => {
    watchValidator()
    watchBlockSigner()
}).catch(e => {
    console.log('getCurrentCandidates', e)
    process.exit(1)
})

emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
