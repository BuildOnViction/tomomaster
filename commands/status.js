
const Validator = require('../models/blockchain/validator')
const config = require('config')
const moment = require('moment')
const web3Rpc = require('../models/blockchain/web3rpc')
const logger = require('../helpers/logger')
const db = require('../models/mongodb')
var validator = new Validator(web3Rpc)

async function updateStatus () {
    try {
        const set = new Set()
        let latestBlockNumber = await web3Rpc.eth.getBlockNumber()
        const toEpoch = (latestBlockNumber / config.get('blockchain.epoch')) - 1
        for (let i = 1; i < toEpoch; i++) {
            let proposes = [] // list of proposed nodes
            const endBlock = i * config.get('blockchain.epoch')
            const startBlock = endBlock - config.get('blockchain.epoch') + 1
            const events = await validator.getPastEvents('allEvents', {
                fromBlock: startBlock,
                toBlock: endBlock
            })
            let signers// list of masternode
            let penalties// list of slashed masternodes
            const map = events.map(async (event) => {
                if (event.event === 'Propose') {
                    proposes.push(event.returnValues._candidate.toLowerCase())
                    set.add(event.returnValues._candidate.toLowerCase())
                }
                if (event.event === 'Resign') {
                    set.delete(event.returnValues._candidate.toLowerCase())
                }
            })
            await Promise.all(map)
            signers = await getSigners(i)
            if (i - 1 === 0) {
                signers.map(s => set.add(s))
            }

            const blks = []
            for (let j = 0; j <= 5; j++) {
                let checkpoint = endBlock - (j * 900)
                if (checkpoint > 0) {
                    blks.push(await web3Rpc.eth.getBlock(checkpoint))
                }
            }
            if (blks.length > 0) {
                penalties = await getPenalties(blks)
            }

            // filter slashed masternodes
            signers = signers.filter(s => {
                if (penalties.indexOf(s) < 0) {
                    return s
                }
            })

            // filter propose nodes (out of top 150)
            // not in penalties, signers, proposes
            const canArr = [...set]
            canArr.map(c => {
                if (penalties.indexOf(c) < 0 && signers.indexOf(c) < 0 && proposes.indexOf(c) < 0) {
                    proposes.push(c)
                }
            })

            logger.info('epoch: %s', i)
            logger.info('proposes: %s', proposes)
            logger.info('total candidates: %s', set.size)
            logger.info('penalties - slash: %s', penalties.length)
            logger.info('signers - masternodes: %s', signers.length)
            const block = await web3Rpc.eth.getBlock(i * config.get('blockchain.epoch'))
            await db.Status.findOneAndUpdate({ epoch: i }, {
                epoch: i,
                masternodes: signers,
                penalties: penalties,
                proposes: proposes,
                created_at: moment.unix(block.timestamp).utc()
            }, { upsert: true })
        }
        logger.info('Done')
    } catch (error) {
        logger.error(error)
    }
}

async function getPenalties (blks) {
    const penalties = []
    for (let i = 0; i < blks.length; i++) {
        let pbuff = await Buffer.from((blks[i].penalties || '').substring(2), 'hex')

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

module.exports = { updateStatus }
