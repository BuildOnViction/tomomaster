'use strict'

const HDWalletProvider = require('truffle-hdwallet-provider')
const config = require('config')
const TestRPC = require('ganache-cli')

module.exports = {
    networks: {
        development: {
            provider: TestRPC.provider(),
            network_id: '*'
        },
        local: {
            host: 'localhost',
            port: 8545,
            gas: 4000000,
            network_id: '*'
        },
        tomo: {
            provider: function () {
                return new HDWalletProvider(config.get('truffle.mnemonic'), config.get('blockchain.rpc'))
            },
            network_id: config.get('blockchain.networkId'),
            gas: 4000000,
            gasPrice: 1
        }
    }
}
