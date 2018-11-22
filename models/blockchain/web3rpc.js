'use strict'

const Web3 = require('web3')
const config = require('config')

const provider = new Web3.providers.HttpProvider(config.get('blockchain.rpc'))
const web3 = new Web3(provider)

module.exports = web3
