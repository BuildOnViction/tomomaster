
const Validator = require('../models/blockchain/validator')
const config = require('config')
const moment = require('moment')
const web3Rpc = require('../models/blockchain/web3rpc').Web3RpcInternal()
const logger = require('../helpers/logger')
const db = require('../models/mongodb')
var validator = new Validator(web3Rpc)

async function updateStatus (fromEpoch, toEpoch) {
    try {
        const set = new Set()
        if (!toEpoch) {
            const latestBlockNumber = await web3Rpc.eth.getBlockNumber()
            toEpoch = parseInt((latestBlockNumber / config.get('blockchain.epoch')))
        }
        // not start from every first epoch
        if (fromEpoch && fromEpoch > 1) {
            const check = await db.Status.findOne({
                epoch: fromEpoch - 1
            })
            if (check) {
                const candidates = await db.Status.find({
                    epoch: fromEpoch - 1
                })
                candidates.map(m => {
                    set.add(m.candidate)
                })
            } else {
                throw Error('Should crawl from further, input epoch does not exist')
            }
        }
        if (!fromEpoch) {
            throw Error('Need fromEpoch(-f) argument')
            // fromEpoch = 1
            // await db.Status.remove({})
        }
        logger.info('Crawling from %s to %s', fromEpoch, toEpoch)
        for (let i = fromEpoch; i <= toEpoch; i++) {
            let proposes = [] // list of proposed nodes
            const endBlock = i * config.get('blockchain.epoch')
            const startBlock = endBlock - config.get('blockchain.epoch') + 1
            const events = await validator.getPastEvents('allEvents', {
                fromBlock: startBlock,
                toBlock: endBlock
            })
            let signers = []// list of masternode
            let penalties = []// list of slashed masternodes
            for (let j = 0; j < events.length; j++) {
                const event = events[j]
                if (event.event === 'Propose') {
                    proposes.push(event.returnValues._candidate.toLowerCase())
                    set.add(event.returnValues._candidate.toLowerCase())
                }
                if (event.event === 'Resign') {
                    set.delete(event.returnValues._candidate.toLowerCase())
                }
            }

            signers = await getSigners(i)
            if (i - 1 === 0) {
                signers.map(s => set.add(s))
            }

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

            // filter propose nodes (out of top 150)
            // not in penalties, signers, proposes
            const canArr = [...set]
            const map2 = canArr.map(c => {
                if (penalties.indexOf(c) < 0 && signers.indexOf(c) < 0 && proposes.indexOf(c) < 0) {
                    proposes.push(c)
                }
            })
            await Promise.all(map2)

            logger.info(`
            epoch: ${i}
            proposes: ${proposes}
            total candidates: ${set.size}
            penalties - slash: ${penalties.length}
            signers - masternodes: ${signers.length}`)

            const block = await web3Rpc.eth.getBlock((i - 1) * config.get('blockchain.epoch'))
            const epochCreatedAt = moment.unix(block.timestamp).utc()

            const a = signers.map(async m => {
                db.Status.updateOne({ epoch: i, candidate: m },
                    {
                        epoch: i,
                        candidate: m,
                        status: 'MASTERNODE',
                        epochCreatedAt: epochCreatedAt
                    },
                    { upsert: true }).then(() => { return true }).catch(e => console.log(e))
            })
            const b = penalties.map(async m => {
                db.Status.updateOne({ epoch: i, candidate: m },
                    {
                        epoch: i,
                        candidate: m,
                        status: 'SLASHED',
                        epochCreatedAt: epochCreatedAt
                    },
                    { upsert: true }).then(() => { return true }).catch(e => console.log(e))
            })
            const c = proposes.map(async m => {
                db.Status.updateOne({ epoch: i, candidate: m },
                    {
                        epoch: i,
                        candidate: m,
                        status: 'PROPOSED',
                        epochCreatedAt: epochCreatedAt
                    },
                    { upsert: true }).then(() => { return true }).catch(e => console.log(e))
            })
            await Promise.all([b, c, a])
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

module.exports = { updateStatus }
