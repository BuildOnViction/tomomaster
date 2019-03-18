
'use strict'
const Validator = require('./models/blockchain/validator')
// const Web3Ws = require('./models/blockchain/web3ws')
const web3Rpc = require('./models/blockchain/web3rpc')
const config = require('config')
// const db = require('./models/mongodb')
// const BigNumber = require('bignumber.js')
// const moment = require('moment')
const logger = require('./helpers/logger')
// const axios = require('axios')
// const _ = require('lodash')

var validator = new Validator(web3Rpc)

async function updateRanks (fromEpoch, toEpoch) {
    try {
        const set = new Set()
        logger.info('Crawling from %s to %s', fromEpoch, toEpoch)
        for (let i = fromEpoch; i <= toEpoch; i++) {
            const endBlock = i * config.get('blockchain.epoch')
            const startBlock = endBlock - config.get('blockchain.epoch') + 1

            const events = await validator.getPastEvents('allEvents', {
                fromBlock: startBlock,
                toBlock: endBlock
            })

            let signers = []// list of masternode
            let penalties = []// list of slashed masternodes
            let candidates = await validator.methods.getCandidates().call()
            console.log(candidates)

            for (let j = 0; j < events.length; j++) {
                const event = events[j]
                if (event.event === 'Propose') {
                    console.log(event.returnValues._cap)
                    set.add(event.returnValues._candidate.toLowerCase())
                }
                if (event.event === 'Resign') {
                    set.delete(event.returnValues._candidate.toLowerCase())
                }
            }

            signers = await getSigners(i)

            const blks = []
            for (let j = 1; j <= 5; j++) {
                let checkpoint = endBlock - (j * 900)
                if (checkpoint > 0) {
                    blks.push(await web3Rpc.eth.getBlock(checkpoint))
                }
            }
            if (blks.length > 0) {
                penalties = getPenalties(blks)
            }
            // const masternodes = signers.concat(penalties)
            // web3 eth getbalance
            // const a = await Promise.all(masternodes.map(async (m) => {
            //     let capacity = await validator.methods.getCandidateCap(m).call()
            //     capacity = new BigNumber(capacity).dividedBy(10 ** 18).toString(10)
            //     return {
            //         address: m,
            //         capacity
            //     }
            // }))
            // const b = a.sort((c, d) => new BigNumber(c.capacity).comparedTo(new BigNumber(d.capacity)))
            // console.log(b)
            // set rank
            logger.info(`
            epoch: ${i}
            penalties - slash: ${penalties.length}
            signers - masternodes: ${signers.length}`)
        }
        logger.info('Done')
    } catch (error) {
        logger.error(error)
    }
}

function getPenalties (blks) {
    const penalties = []
    for (let i = 0; i < blks.length; i++) {
        let pbuff = Buffer.from((blks[i].penalties || '').substring(2), 'hex')

        if (pbuff.length > 0) {
            for (let i = 1; i <= pbuff.length / 20; i++) {
                let address = pbuff.slice((i - 1) * 20, i * 20)
                penalties.push('0x' + address.toString('hex'))
            }
        }
    }
    return penalties
}

async function getSigners (epoch) {
    // check signers/masternodes in checkpoint block -1
    const signers = []
    const blockCheckpointData = await web3Rpc.eth.getBlock((epoch - 1) * config.get('blockchain.epoch'))
    let buff = Buffer.from(blockCheckpointData.extraData.substring(2), 'hex')
    let sbuff = buff.slice(32, buff.length - 65)

    if (sbuff.length > 0) {
        for (let i = 1; i <= sbuff.length / 20; i++) {
            let address = sbuff.slice((i - 1) * 20, i * 20)
            // list of signers
            signers.push('0x' + address.toString('hex'))
        }
    }
    return signers
}

module.exports = { updateRanks }

updateRanks(1, 5)
