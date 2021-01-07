'use strict'

const HDWalletProvider = require('@truffle/hdwallet-provider')
const NonceTrackerSubprovider = require('web3-provider-engine/subproviders/nonce-tracker')
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
                let w = new HDWalletProvider(config.get('truffle.mnemonic'), config.get('blockchain.rpc'))
                let nonceTracker = new NonceTrackerSubprovider()
                w.engine._providers.unshift(nonceTracker)
                nonceTracker.setEngine(w.engine)
                return w
            },
            network_id: config.get('blockchain.networkId'),
            gas: 4000000,
            gasPrice: 10000000000000
        },
        coverage: {
            host: 'localhost',
            network_id: '*',
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }
    }
}
