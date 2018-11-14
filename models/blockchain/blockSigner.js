'use strict'

const BlockSignerABI = require('../../abis/BlockSigner')
const web3 = require('./web3')
const config = require('config')
const blockSigner = new web3.eth.Contract(BlockSignerABI.abi, config.get('blockchain.blockSignerAddress'))

module.exports = blockSigner
