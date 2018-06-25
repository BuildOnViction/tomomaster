'use strict'
require('babel-register')
require('babel-polyfill')
require('dotenv').config()

const HDWalletProvider = require('truffle-hdwallet-provider')
const config = require('config')
const TestRPC = require('ganache-cli')

module.exports = {
    networks: {
        development: {
            // provider: function () {
            //     let wallet = new HDWalletProvider(process.env.MNEMONIC, 'http://127.0.0.1:8545')
            //     return wallet
            // },
            provider: TestRPC.provider(),
            network_id: '*' // Match any network id
        },
        local: {
            host: 'localhost',
            port: 8545,
            gas: 4000000,
            network_id: '*'
        },
        tomo: {
            provider: function () {
                return new HDWalletProvider(process.env.MNEMONIC, config.get('blockchain.rpc'))
            },
            network_id: config.get('blockchain.networkId'),
            gasPrice: 1
        }
    }
}
