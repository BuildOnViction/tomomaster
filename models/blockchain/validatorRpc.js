'use strict'

const ValidatorABI = require('../../build/contracts/TomoValidator')
const web3 = require('./web3rpc').Web3Rpc()
const config = require('config')
const validator = new web3.eth.Contract(ValidatorABI.abi, config.get('blockchain.validatorAddress'))

module.exports = validator
