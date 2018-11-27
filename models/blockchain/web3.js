'use strict'

const Web3 = require('web3')
const config = require('config')

let provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))
const web3 = new Web3(provider)

provider.on('error', e => console.log('WS Error', e))
provider.on('end', e => {
    console.log('WS closed')
    console.log('Attempting to reconnect...')
    provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))

    provider.on('connect', function () {
        console.log('WSS Reconnected')
    })

    web3.setProvider(provider)
})

module.exports = web3
