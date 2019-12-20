'use strict'

const Validator = require('../models/blockchain/validator')
const Web3Ws = require('../models/blockchain/web3ws').Web3Ws
const config = require('config')
const db = require('../models/mongodb')
const moment = require('moment')
const logger = require('../helpers/logger')

var web3 = new Web3Ws()
var validator = new Validator(web3)

async function watchValidator (from, to) {
    try {
        logger.info('TomoValidator %s - Listen events from block number %s to %s',
            config.get('blockchain.validatorAddress'), from, to)

        return validator.getPastEvents('allEvents', {
            fromBlock: from,
            toBlock: to
        }).then(async events => {
            let map = events.map(async (event) => {
                let result = event
                logger.debug('Event %s in block %s', result.event, result.blockNumber)
                let candidate = (result.returnValues._candidate || '').toLowerCase()
                let voter = (result.returnValues._voter || '').toLowerCase()
                let owner = (result.returnValues._owner || '').toLowerCase()
                if (!voter && (event.event === 'Resign' || event.event === 'Withdraw' || event.event === 'Propose')) {
                    voter = owner
                }
                let capacity = result.returnValues._cap
                let blk = await web3.eth.getBlock(result.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()
                await db.Transaction.updateOne({
                    tx: result.transactionHash
                }, {
                    $set: {
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        tx: result.transactionHash,
                        event: result.event,
                        voter: voter,
                        owner: owner,
                        candidate: candidate,
                        capacity: capacity,
                        blockNumber: result.blockNumber,
                        createdAt: createdAt
                    }
                }, {
                    upsert: true
                })
            })

            return Promise.all(map)
        }).catch(e => {
            logger.error('watchValidator %s', e)
            web3 = new Web3Ws()
            validator = new Validator(web3)
            return watchValidator(from, to)
        })
    } catch (e) {
        logger.error('watchValidator2 %s', e)
        web3 = new Web3Ws()
        validator = new Validator(web3)
        return watchValidator(from, to)
    }
}

async function run (start) {
    let max = await web3.eth.getBlockNumber()
    let end = ((start + 99) > max) ? max : (start + 99)

    await watchValidator(start, end)

    if (start === end) {
        logger.info('BlockNumber %s DONE!!!', max)
        return process.exit(0)
    }

    return run(end + 1)
}

module.exports = { run }
