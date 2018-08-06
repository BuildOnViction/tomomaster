'use strict'

const fs = require('fs')

// copy & save TomoValidator
let TomoValidatorAbi = require('./build/contracts/TomoValidator.json')
let networks = TomoValidatorAbi.networks
networks['89'].address = '0x0000000000000000000000000000000000000088'
let data = JSON.stringify(TomoValidatorAbi, null, 2)
fs.writeFileSync('./abis/TomoValidator.json', data)

// copy & save BlockSigner
let BlockSignerAbi = require('./build/contracts/BlockSigner.json')
networks = BlockSignerAbi.networks
networks['89'].address = '0x0000000000000000000000000000000000000089'
data = JSON.stringify(BlockSignerAbi, null, 2)
fs.writeFileSync('./abis/BlockSigner.json', data)

// copy & save TomoRandomize
let TomoRandomizeAbi = require('./build/contracts/TomoRandomize.json')
networks = TomoRandomizeAbi.networks
networks['89'].address = '0x0000000000000000000000000000000000000090'
data = JSON.stringify(TomoRandomizeAbi, null, 2)
fs.writeFileSync('./abis/TomoRandomize.json', data)

// copy & save Migrations
let MigrationsAbi = require('./build/contracts/Migrations.json')
data = JSON.stringify(MigrationsAbi, null, 2)
fs.writeFileSync('./abis/Migrations.json', data)

// copy & save SafeMath
let SafeMathAbi = require('./build/contracts/SafeMath.json')
data = JSON.stringify(SafeMathAbi, null, 2)
fs.writeFileSync('./abis/SafeMath.json', data)
