'use strict'

const { BlockSigner } = require('./models/blockchain/blockSigner')
const chain = require('./models/blockchain/chain')
const db = require('./models/mongodb')
const config = require('config')
const moment = require('moment')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(100)

async function watchBlockSigner () {
    try {
        let bs = await BlockSigner.deployed()
        let cs = await db.CrawlState.findOne({
            smartContractAddress: bs.address
        })
        let blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
        let epoch = parseInt(config.get('blockchain.epoch'))
        let latestBlockNumber = await chain.eth.blockNumber
        if (blockNumber < (latestBlockNumber - 1 * epoch)) {
            blockNumber = latestBlockNumber - 1 * epoch
        }
        console.info('BlockSigner %s - Listen events from block number %s ...', bs.address, blockNumber)
        const allEvents = bs.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        })
        allEvents.watch(async (err, res) => {
            if (err || !(res || {}).args) {
                console.error(err, res)
                return false
            }
            console.info('BlockSigner - New event %s from block %s', res.event, res.blockNumber)

            try {
                await db.CrawlState.updateOne({
                    smartContractAddress: bs.address
                }, { $set:{
                    smartContractAddress: bs.address,
                    blockNumber: res.blockNumber
                } }, { upsert: true })

                let signer = res.args._signer
                let tx = res.transactionHash
                let bN = String(res.args._blockNumber)
                let bH = String(res.args._blockHash)

                let blk = await chain.eth.getBlock(res.blockNumber)
                let createdAt = moment.unix(blk.timestamp).utc()

                return db.BlockSigner.updateOne({
                    smartContractAddress: bs.address,
                    blockHash: bH
                }, {
                    $set: {
                        smartContractAddress: bs.address,
                        blockNumber: bN,
                        blockHash: bH
                    },
                    $addToSet: {
                        signers: {
                            signer: signer,
                            tx: tx,
                            createdAt: createdAt
                        }
                    }
                }, { upsert: true })
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

watchBlockSigner()

emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
