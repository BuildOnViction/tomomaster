'use strict'

const { Validator } = require('../models/blockchain/validator')
const db = require('../models/mongodb')
const config = require('config')

Validator.deployed().then(function (v) {
    return db.CrawlState.findOne({
        smartContractAddress: v.address,
        networkId: config.get('blockchain.networkId')
    }).then(cs => {
        const blockNumber = parseInt((cs || {}).blockNumber || 0) + 1
        console.info('Crawl from block number %s ...', blockNumber)
        const allEvents = v.allEvents({
            fromBlock: blockNumber,
            toBlock: 'latest'
        })
        return allEvents.watch((err, res) => {
            console.info('blockNumberRewardEngine', res, res.blockNumber)
            if (cs) {
                cs.blockNumber = res.blockNumber
            } else {
                cs = new db.CrawlState({
                    smartContractAddress: v.address,
                    networkId: config.get('blockchain.networkId'),
                    blockNumber: res.blockNumber
                })
            }
            if (err) {
                throw Error('Listen events errors')
            }
            const tx = new db.Transaction({
                smartContractAddress: v.address,
                blockNumber: res.blockNumber,
                voter: res.args._voter,
                candidate: res.args._candidate,
                capacity: res.args._capacity
            })
            tx.save()
            return cs.save()
        })
    })
}).catch(e => console.error(e))
