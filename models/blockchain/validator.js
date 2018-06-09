'use strict'

const contract = require('truffle-contract')
const ValidatorArtifacts = require('../../build/contracts/TomoValidator.json')
const chain = require('./chain')
const Validator = contract(ValidatorArtifacts)

const provider = chain.currentProvider

Validator.setProvider(provider)

module.exports = {
    chain,
    Validator
}
