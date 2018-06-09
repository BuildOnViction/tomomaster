'use strict'

const Web3 = require('web3')
const config = require('config')

const chain = new Web3(new Web3.providers.HttpProvider(config.get('blockchain.rpc')))

module.exports = chain
