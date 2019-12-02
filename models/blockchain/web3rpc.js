'use strict'

const Web3 = require('web3')
const config = require('config')

const web3Prc = {
    Web3Rpc: function () {
        const provider = new Web3.providers.HttpProvider(config.get('blockchain.rpc'))
        const web3 = new Web3(provider)
        return web3
    },
    Web3RpcInternal: function () {
        const internalProvider = new Web3.providers.HttpProvider(config.get('blockchain.internalRpc'))
        const web3Internal = new Web3(internalProvider)
        return web3Internal
    }
}

module.exports = web3Prc
