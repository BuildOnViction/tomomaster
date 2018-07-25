'use strict'

const Web3 = require('web3')
const config = require('config')

const provider = new Web3.providers.HttpProvider(config.get('blockchain.rpc'))
const chain = new Web3(provider)
if (!provider.isConnected()) {
    console.error('RPC connection lost - shut down service')
    process.exit()
}

module.exports = chain
