## TomoChain Governance DApp
This is Governance Dapp for TomoChain. Full-Node can apply to become a candidate for masternode. Coin Holder can vote for candidates to become masternodes. See the detail from technical Whitepaper: [https://tomochain.com/docs/technical-whitepaper--1.0.pdf](https://tomochain.com/docs/technical-whitepaper--1.0.pdf)

## Requirements
- MongoDB
- Truffle Framework

## Config
```
cp config/default.json config/local.json
```
Update `local.json` file to support your environment


```cp .env.dev .env```

Update `.env` file to support `truffle` environment 

## Install
```
npm install
truffle deploy --reset --network tomo
```
Note: before deploying to tomochain testnet, make sure you have $TOMO in the wallet. If not, get free at [https://faucet.tomochain.com](https://faucet.tomochain.com)

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



To test a special file
```
npm run test path_to_file/file.js
```
Or run command
```
truffle test path_to_file/file.js
```

