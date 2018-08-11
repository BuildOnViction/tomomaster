'use strict'

const { Validator } = require('../models/blockchain/validator')
const db = require('../models/mongodb')
const BigNumber = require('bignumber.js')
const consumer = {}

consumer.name = 'voteHistory'
consumer.task = async function (job, done) {
    let candidate = job.data.candidate
    let blockNumber = job.data.blockNumber
    let validator = await Validator.deployed()
    let aVoters = await validator.getVoters.call(candidate)
    let map = aVoters.map(v => {
        let cap = validator.getVoterCap(candidate, v)
        return {
            address: v,
            capacity: new BigNumber(cap).toString()
        }
    })
    let voters = await Promise.all(map)
    await db.VoteHistory.create({
        smartContractAddress: validator.address,
        candidate: candidate,
        blockNumber: blockNumber,
        voters: voters
    })

    done()
}

module.exports = consumer
