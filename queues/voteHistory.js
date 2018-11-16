'use strict'

const validator = require('../models/blockchain/validator')
const db = require('../models/mongodb')
const config = require('config')
const BigNumber = require('bignumber.js')
const consumer = {}

consumer.name = 'voteHistory'
consumer.task = async function (job, done) {
    let candidate = job.data.candidate
    let blockNumber = job.data.blockNumber
    try {
        let aVoters = await validator.methods.getVoters(candidate).call()
        let map = aVoters.map(async v => {
            let cap = await validator.methods.getVoterCap(candidate, v)
            return {
                address: v,
                capacity: new BigNumber(cap).toString()
            }
        })
        let voters = await Promise.all(map)
        await db.VoteHistory.create({
            smartContractAddress: config.get('blockchain.validatorAddress'),
            candidate: candidate,
            blockNumber: blockNumber,
            voters: voters
        })
    } catch (e) {
        console.error('ERROR voteHistory', e)
        done(e)
    }

    done()
}

module.exports = consumer
