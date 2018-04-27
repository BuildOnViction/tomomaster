'use strict'
const HDWalletProvider = require('truffle-hdwallet-provider')
const config = require('config')

module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*'
        },
        tomo: {
            provider: function () {
                return new HDWalletProvider(process.env.MNEMONIC, config.get('tomo'))
            },
            network_id: 40686
        }
    }
}
