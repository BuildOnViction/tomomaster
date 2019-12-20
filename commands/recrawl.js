'use strict'

const Validator = require('../models/blockchain/validator')
const Web3Ws = require('../models/blockchain/web3ws').Web3Ws
// const web3Rpc = require('../models/blockchain/web3rpc')
const config = require('config')
const db = require('../models/mongodb')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const logger = require('../helpers/logger')

const web3 = new Web3Ws()
const validator = new Validator(web3)

async function watchValidator (fromBlock, toBlock = false) {
    try {
        if (!fromBlock) {
            throw Error('fromBlock(-f) required, toBlock(-t) optional')
        }
        logger.info('TomoValidator %s - Listen events from block number %s ...',
            config.get('blockchain.validatorAddress'), fromBlock)

        return validator.getPastEvents('allEvents', {
            fromBlock: fromBlock,
            toBlock: toBlock || 'latest'
        }).then(async events => {
            let map = events.map(async (event) => {
                let result = event
                logger.debug('Event %s in block %s', result.event, result.blockNumber)
                let candidate = (result.returnValues._candidate || '').toLowerCase()
                let voter = (result.returnValues._voter || '').toLowerCase()
                let owner = (result.returnValues._owner || '').toLowerCase()
                let capacity = result.returnValues._cap
                let blk = await web3.eth.getBlock(result.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()

                // get balance
                let candidateCap = 0
                if (candidate) {
                    candidateCap = await validator.methods.getCandidateCap(candidate).call()
                }
                console.log(result)
                await db.Transaction.findOneAndUpdate({
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
                        createdAt: createdAt,
                        currentCandidateCap: new BigNumber(candidateCap)
                    }
                }, {
                    upsert: true
                })
            })

            await Promise.all(map)
            logger.info('Done')
        })
    } catch (error) {
        logger.error(error)
    }
}
module.exports = { watchValidator }
