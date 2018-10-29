'use strict'

const chain = require('./models/blockchain/chain')
const db = require('./models/mongodb')
const config = require('config')
const q = require('./queues')
const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

process.setMaxListeners(100)

function watchNewBlock () {
    try {
        chain.eth.filter('latest').watch(async (err, block) => {
            if (err) {
                emitter.emit('error', err)
            }
            try {
                let blk = await chain.eth.getBlock('latest')
                await updateSigners(blk)
                let epoch = parseInt(config.get('blockchain.epoch'))
                let blockNumber = blk.number
                console.log('Get latest block', blockNumber)
                if (blockNumber % epoch === 0) {
                    q.create('reward', { block: blk })
                        .priority('high').removeOnComplete(true).save()
                }
            } catch (e) {
                console.error(e)
            }
        })
    } catch (e) {
        emitter.emit('error', e)
    }
}

async function updateSigners (blk) {
    try {
        if (!blk) {
            let latestBlockNumber = await chain.eth.blockNumber
            let lastCheckpoint = latestBlockNumber - (latestBlockNumber % parseInt(config.get('blockchain.epoch')))
            if (lastCheckpoint > 0) {
                blk = await chain.eth.getBlock(lastCheckpoint)
            } else {
                return false
            }
        }
        let buff = Buffer.from(blk.extraData.substring(2), 'hex')
        let sbuff = buff.slice(32, buff.length - 65)
        let signers = []
        if (sbuff.length > 0) {
            for (let i = 1; i <= sbuff.length / 20; i++) {
                let address = sbuff.slice((i - 1) * 20, i * 20)
                signers.push('0x' + address.toString('hex'))
            }
            await db.Signer.create({
                networkId: config.get('blockchain.networkId'),
                blockNumber: blk.number,
                signers: signers
            })
        }
        return signers
    } catch (e) {
        console.error(e)
    }
}

updateSigners(false)
watchNewBlock()
emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})
