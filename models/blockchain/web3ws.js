'use strict'

const Web3 = require('web3')
const config = require('config')

function Web3Ws () {
    let provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))
    let web3 = new Web3(provider)
    return web3
}

module.exports = Web3Ws
