'use strict'

// const Validator = require('./models/blockchain/validator')
const web3Rpc = require('../models/blockchain/web3rpc')
const logger = require('./logger')
const config = require('config')
const db = require('../models/mongodb')

async function updatePenalty (fromBlock = 0, toBlock = null) {
    try {
        let checkpoints = []
        // latest block
        let toBlockNumber = toBlock || await web3Rpc.eth.getBlockNumber()
        for (let i = fromBlock; i <= toBlockNumber; i++) {
            if (i % parseInt(config.get('blockchain.epoch')) === 0) {
                let checkpoint = i - (i % parseInt(config.get('blockchain.epoch')))
                checkpoints.push(await web3Rpc.eth.getBlock(checkpoint))
            }
        }
        if (checkpoints.length === 0) {
            return false
        }

        let getPenalty = async function (blk) {
            let sbuff = Buffer.from((blk.penalties || '').substring(2), 'hex')
            let penalties = []
            const epoch = parseInt(blk.number / config.get('blockchain.epoch')) - 1
            if (sbuff.length > 0) {
                for (let i = 1; i <= sbuff.length / 20; i++) {
                    let address = sbuff.slice((i - 1) * 20, i * 20)
                    penalties.push('0x' + address.toString('hex'))
                }

                await db.Penalty.update({ epoch: epoch }, {
                    networkId: config.get('blockchain.networkId'),
                    blockNumber: blk.number,
                    epoch: epoch,
                    penalties: penalties
                }, { upsert: true })
            }
            return penalties
        }
        let data = []

        for (let i = checkpoints.length - 1; i >= 0; i -= 5) {
            if (i - 5 < 0) {
                continue
            } else {
                data.push([checkpoints[i], checkpoints[i - 1], checkpoints[i - 2],
                    checkpoints[i - 3], checkpoints[i - 4]])
            }
        }

        await Promise.all(data.map(blks => blks.map(blk => {
            getPenalty(blk)
        })))
        logger.infor('Done')
        process.exit(1)
    } catch (error) {
        logger.error('update penalty table %s', error)
    }
}

module.exports = { updatePenalty }
