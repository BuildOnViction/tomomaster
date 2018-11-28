'use strict'

const Web3 = require('web3')
const config = require('config')

const provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))
const web3 = new Web3(provider)

const reconnect = function (e) {
    console.log('WS closed/errored', e)
    console.log('Attempting to reconnect...')
    web3.setProvider(provider)

    provider.on('connect', function () {
        console.log('WSS Reonnected')
    })
}
provider.on('error', (e) => reconnect(e))
provider.on('end', (e) => reconnect(e))

module.exports = web3
