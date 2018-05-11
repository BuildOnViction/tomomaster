'use strict'

const Web3 = require('web3')
const contract = require('truffle-contract')
const config = require('config')
const ValidatorArtifacts = require('../../build/contracts/TomoValidator.json')
const Validator = contract(ValidatorArtifacts)

const provider = (new Web3(new Web3.providers.HttpProvider(config.get('blockchain.rpc')))).currentProvider

Validator.setProvider(provider)

module.exports = {
    Validator
}
