'use strict'

const Web3 = require('web3')
const config = require('config')

const provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ws'))
const web3 = new Web3(provider)

const restart = function (e) {
    console.error('Connection error', e)
    console.error('Restart process')
    process.exit(1)
}

provider.on('error', (e) => restart(e))
provider.on('end', (e) => restart(e))

module.exports = web3
