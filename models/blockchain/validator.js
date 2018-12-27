'use strict'

const ValidatorABI = require('../../build/contracts/TomoValidator')
const config = require('config')

function Validator (web3) {
    const validator = new web3.eth.Contract(ValidatorABI.abi, config.get('blockchain.validatorAddress'))
    return validator
}

module.exports = Validator
