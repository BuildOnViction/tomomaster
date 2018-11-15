'use strict'

const Web3 = require('web3')
const config = require('config')

const provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))
const web3 = new Web3(provider)

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err)
    process.exit()
})

module.exports = web3
