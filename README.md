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

## Install
```
truffle deploy --reset --network tomo
npm install
```
Note: before deploying to tomochain testnet, make sure you have $TOMO in the wallet. If not, get free at https://faucet.tomochain.com

## Run
```
npm run dev
```
The site will run at `http://localhost:3000`
