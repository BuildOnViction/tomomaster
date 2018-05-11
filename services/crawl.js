'use strict'

const { Validator } = require('../models/blockchain/validator')
const db = require('../models/mongodb')

async function watch () {
    let v = await Validator.deployed()
    let cs = await db.CrawlState.findOne({
        smartContractAddress: v.address
    })
    const blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
    console.info('Listen events from block number %s ...', blockNumber)
    const allEvents = v.allEvents({
        fromBlock: blockNumber,
        toBlock: 'latest'
    })
    return allEvents.watch((err, res) => {
        if (err || !(res || {}).args) {
            console.error(err, res)
            return false
        }
        console.info('New event %s from block %s', res.event, res.blockNumber)
        if (cs) {
            cs.blockNumber = res.blockNumber
        } else {
            cs = new db.CrawlState({
                smartContractAddress: v.address,
                blockNumber: res.blockNumber
            })
        }
        let event = res.event
        let candidate = res.args._candidate
        let voter = res.args._voter
        let capacity = res.args._cap
        let tx = new db.Transaction({
            smartContractAddress: v.address,
            blockNumber: res.blockNumber,
            event: event,
            voter: voter,
            candidate: candidate,
            capacity: capacity
        })
        tx.save()
        cs.save()
        if (event === 'Vote' || event === 'Unvote') {
            updateVoterCap(candidate, voter)
        }
        updateCandidateCap(candidate)
    })
}

async function updateCandidateCap (candidate) {
    try {
        let validator = await Validator.deployed()
        let capacity = await validator.getCandidateCap.call(candidate)
        console.info('Update candidate %s capacity %s', candidate, String(capacity))
        return db.Candidate.update({
            smartContractAddress: validator.address,
            candidate: candidate
        }, {
            $set: {
                smartContractAddress: validator.address,
                candidate: candidate,
                capacity: String(capacity)
            }
        }, { upsert: true })
    } catch (e) {
        console.error(e)
    }
}

async function updateVoterCap (candidate, voter) {
    try {
        let validator = await Validator.deployed()
        let capacity = await validator.getVoterCap.call(candidate, voter)
        console.log('Update voter %s for candidate %s capacity %s', voter, candidate, String(capacity))
        return db.Voter.update({
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

        let map = candidates.map((candidate) => {
            return updateCandidateCap(candidate)
        })
        return Promise.all(map).catch(e => console.error(e))
    } catch (e) {
        console.error(e)
    }
}

try {
    getCurrentCandidates()
    watch()
} catch (e) {
    console.error(e)
}
