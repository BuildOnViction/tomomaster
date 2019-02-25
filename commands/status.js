'use strict'

// const Validator = require('./models/blockchain/validator')
const web3Rpc = require('../models/blockchain/web3rpc')
const logger = require('../helpers/logger')
const config = require('config')
// const moment = require('moment')
const db = require('../models/mongodb')

async function updateStatues () {
    try {
        // get latest epoch
        const latestBlock = await web3Rpc.eth.getBlockNumber()
        const latestEpoch = parseInt(latestBlock / config.get('blockchain.epoch')) - 1
        // loop from 0 to latest epoch
        for (let i = 0; i < latestEpoch; i++) {
            await db.Candidate.updateMany({ status: { $nin: ['RESIGNED'] } }, { $set: { status: 'PROPOSED' } })

            const blockNumber = (i + 1) * config.get('blockchain.epoch')
            console.log('Reading block ', blockNumber)
            const blk = await web3Rpc.eth.getBlock(blockNumber)

            // update candidate table
            let buff = Buffer.from(blk.extraData.substring(2), 'hex')
            let sbuff = buff.slice(32, buff.length - 65)
            let address
            if (sbuff.length > 0) {
                for (let i = 1; i <= sbuff.length / 20; i++) {
                    address = sbuff.slice((i - 1) * 20, i * 20)
                    // update candidate status
                    await db.Candidate.updateOne({
                        smartContractAddress: config.get('blockchain.validatorAddress'),
                        candidate: '0x' + address.toString('hex').toLowerCase()
                    }, {
                        $set: {
                            status: 'MASTERNODE'
                        }
                    }, { upsert: true })
                }
            }
            console.log('Done update candidate infor')

            // update penalties
            // check last epoch to see if masternode is slashed
            await updatePenalty(blk)
            const epoch = parseInt(blockNumber / config.get('blockchain.epoch')) - 1
            if (epoch === 615) {
                const c = await db.Candidate.find({ status: 'PROPOSED' })
                console.log('checking', c)
            }
            console.log('Done update candidate penalty')
            await updateStatusHistory(blockNumber)
            console.log('Done update status')
        }
    } catch (error) {
        console.log(error)
    }
}

async function updateStatusHistory (blk) {
    try {
        console.log('is this run first????')
        const penalties = []
        const masternodes = []
        const proposes = []

        // const latestBlockNumber = await web3.eth.getBlockNumber()
        // const blockCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))

        const epoch = parseInt(blk / config.get('blockchain.epoch')) - 1

        const slashPromise = db.Candidate.find({ status: 'SLASHED' })
        const MNPromise = db.Candidate.find({ status: 'MASTERNODE' })
        const ProposePromise = db.Candidate.find({ status: 'PROPOSED' })
        const blockDataPromise = web3Rpc.eth.getBlock(blk)

        const slash = await slashPromise
        slash.map(s => penalties.push(s.candidate))
        const masternode = await MNPromise
        masternode.map(m => masternodes.push(m.candidate))
        const propose = await ProposePromise
        propose.map(p => proposes.push(p.candidate))
        const blockData = await blockDataPromise
        // insert Status table
        if (epoch === 615) {
            const c = await db.Candidate.find({ status: 'SLASHED' })
            console.log('history', c)
        }

        await db.Status.findOneAndUpdate({ epoch: epoch }, {
            epoch: epoch,
            masternodes: masternodes,
            penalties: penalties,
            proposes: proposes,
            createdAt: new Date(blockData.timestamp * 1000)
        }, { upsert: true })
    } catch (e) {
        logger.error('updateStatusHistory %s', e)
    }
}

async function updatePenalty (blk) {
    let pbuff = Buffer.from((blk.penalties || '').substring(2), 'hex')
    let penalties = []
    // const epoch = (blk.number / config.get('blockchain.epoch')) - 1
    if (pbuff.length > 0) {
        for (let i = 1; i <= pbuff.length / 20; i++) {
            let address = pbuff.slice((i - 1) * 20, i * 20)
            penalties.push('0x' + address.toString('hex'))

            await db.Candidate.updateOne({
                smartContractAddress: config.get('blockchain.validatorAddress'),
                candidate: '0x' + address.toString('hex').toLowerCase()
            }, {
                $set: {
                    status: 'SLASHED'
                }
            }, { upsert: true })
            // await updateCandidateSlashed('0x' + address.toString('hex').toLowerCase(), blk.number)
        }
    } else {
        const currentEpoch = (blk.number / config.get('blockchain.epoch')) - 1

        const lastEpoch = currentEpoch - 1
        const lastEpochData = await db.Status.findOne({ epoch: lastEpoch })
        if (lastEpoch === 615) {
            console.log(`
            
            
            HERERERER
            currrent: ${currentEpoch}
            last: ${lastEpoch}
            
            ${lastEpochData}`)
        }
        if (lastEpochData) {
            console.log(11111111111111)
            console.log(currentEpoch)
            // update candidate again
            for (let i = 0; i < lastEpochData.penalties.length; i++) {
                await db.Candidate.updateOne({
                    smartContractAddress: config.get('blockchain.validatorAddress'),
                    candidate: lastEpochData.penalties[i].toLowerCase()
                }, {
                    $set: {
                        status: 'SLASHED'
                    }
                }, { upsert: true })
            }
        }
    }
}

module.exports = { updateStatues }
