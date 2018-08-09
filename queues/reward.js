'use strict'

/*
const db = require('../models/mongodb')
const config = require('config')
const web3 = require('../models/blockchain/chain')
*/
const consumer = {}

consumer.name = 'reward'
consumer.task = async function (job, done) {
    let block = job.data.block
    console.log('reward for', block.hash)

    done()
}

module.exports = consumer
