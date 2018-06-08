'use strict'

const contract = require('truffle-contract')
const BlockSignerArtifacts = require('../../build/contracts/BlockSigner.json')
const chain = require('./chain')
const BlockSigner = contract(BlockSignerArtifacts)

const provider = chain.currentProvider

BlockSigner.setProvider(provider)

module.exports = {
    BlockSigner
}
