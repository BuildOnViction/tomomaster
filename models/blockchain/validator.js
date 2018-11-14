'use strict'

const ValidatorABI = require('../../abis/TomoValidator')
const web3 = require('./web3')
const config = require('config')
const validator = new web3.eth.Contract(ValidatorABI.abi, config.get('blockchain.validatorAddress'))

module.exports = validator
