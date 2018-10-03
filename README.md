## TomoChain Governance DApp
[![GitHub version](https://badge.fury.io/gh/tomochain%2Ftomomaster.svg)](https://badge.fury.io/gh/tomochain%2Ftomomaster)
[![Build Status](https://travis-ci.org/tomochain/tomomaster.svg?branch=master)](https://travis-ci.org/tomochain/tomomaster)
[![devDependencies Status](https://david-dm.org/tomochain/tomomaster.svg)](https://david-dm.org/dwyl/goodparts?type=dev)
[![JavaScript Style Guide: Good Parts](https://img.shields.io/badge/code%20style-goodparts-brightgreen.svg?style=flat)](https://github.com/dwyl/goodparts "JavaScript The Good Parts")
[![Coverage Status](https://coveralls.io/repos/github/tomochain/tomomaster/badge.svg?branch=master)](https://coveralls.io/github/tomochain/tomomaster?branch=master) [![Join the chat at https://gitter.im/tomochain/tomomaster](https://badges.gitter.im/tomochain/tomomaster.svg)](https://gitter.im/tomochain/tomomaster?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is Governance Dapp for TomoChain. Full-Node can apply to become a candidate for masternode. Coin Holder can vote for candidates to become masternodes. See the detail from technical Whitepaper: https://docs.tomochain.com/whitepaper/](https://docs.tomochain.com/whitepaper/)

## Requirements
- MongoDB
- Truffle Framework

## Config
```
cp config/default.json config/local.json
```
Update `local.json` file to support your environment

## Install
```
npm install
truffle deploy --reset --network tomo
cp abis/*json build/contracts/
```
Note: before deploying to tomochain testnet, make sure you have TOMO in the wallet. If not, get free at [https://faucet.tomochain.com](https://faucet.testnet.tomochain.com)

## Run
```
npm run dev
```
The site will run at [`http://localhost:3000`](http://localhost:3000)

## Test
```
npm run test
```
Or run command
```
truffle test
``` 



#### Test a special file
```
npm run test path_to_file/file.js
```
Or run command
```
truffle test path_to_file/file.js
```

