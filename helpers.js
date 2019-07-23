const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')
const ProviderEngine = require('web3-provider-engine')
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js')
const HookedSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
// const ProviderSubprovider = require('web3-provider-engine/subproviders/provider.js')
// const Web3 = require('web3')
const Transaction = require('ethereumjs-tx')
const ethUtil = require('ethereumjs-util')

/* eslint-disable */

// function HDWalletProvider(
// 	mnemonic,
// 	provider_url,
// 	address_index = 0,
// 	num_addresses = 1,
// 	wallet_hdpath = "m/44'/889'/0'/0"
// ) {
// 	try {

// 		this.mnemonic = mnemonic
// 		if (!bip39.validateMnemonic(this.mnemonic)) {
// 			throw new Error('Invalid Mnemonic Supplied')
// 		}
// 		this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic))
// 		this.wallet_hdpath = wallet_hdpath
// 		this.wallets = {}
// 		this.addresses = []

// 		for (let i = address_index; i < address_index + num_addresses; i++) {
// 			const wallet = this.hdwallet.derivePath(this.wallet_hdpath + '/' + i).getWallet();
// 			const addr = '0x' + wallet.getAddress().toString('hex');
// 			this.addresses.push(addr);
// 			this.wallets[addr] = wallet;
// 		}
// 		console.log(this)
// 	} catch (error) {
// 		throw error
// 	}
// }

function HDWalletProvider (
    mnemonic,
    provider_url,
    address_index = 0,
    num_addresses = 1,
    wallet_hdpath = "m/44'/889'/0'/0/"
  ) {
    this.mnemonic = mnemonic
    this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic))
    this.wallet_hdpath = wallet_hdpath
    this.wallets = {}
    this.addresses = []
    for (let i = address_index; i < address_index + num_addresses; i++) {
        const wallet = this.hdwallet.derivePath(this.wallet_hdpath + '/' + i).getWallet()
        const addr = '0x' + wallet.getAddress().toString('hex')
        this.addresses.push(addr)
        this.wallets[addr] = wallet
    }

    const tmp_accounts = this.addresses
    const tmp_wallets = this.wallets

    this.engine = new ProviderEngine()
    this.engine.addProvider(new HookedSubprovider({
        getAccounts: function (cb) { cb(null, tmp_accounts) },
        getPrivateKey: function (address, cb) {
            if (!tmp_wallets[address]) { return cb('Account not found') }
            else { cb(null, tmp_wallets[address].getPrivateKey().toString('hex')) }
        },
        signTransaction: function (txParams, cb) {
            let pkey
            if (tmp_wallets[txParams.from]) { pkey = tmp_wallets[txParams.from].getPrivateKey() }
            else { cb('Account not found') }
            const tx = new Transaction(txParams)
            tx.sign(pkey)
            const rawTx = '0x' + tx.serialize().toString('hex')
            cb(null, rawTx)
		},
		signMessage(message, cb) {
			const dataIfExists = message.data;
			if (!dataIfExists) {
			  cb('No data to sign');
			}
			if (!tmp_wallets[message.from]) {
			  cb('Account not found');
			}
			let pkey = tmp_wallets[message.from].getPrivateKey();
			const dataBuff = ethUtil.toBuffer(dataIfExists);
			const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
			const sig = ethUtil.ecsign(msgHashBuff, pkey);
			const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
			cb(null, rpcSig);
		}	
    }))
    this.engine.addProvider(new FiltersSubprovider())
    // Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    // this.engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(provider_url)))
    this.engine.addProvider(new RpcSubprovider({
      rpcUrl: provider_url,
    }))
    this.engine.start() // Required by the provider engine.
}

    HDWalletProvider.prototype.sendAsync = function () {
      this.engine.sendAsync.apply(this.engine, arguments)
    }

    HDWalletProvider.prototype.send = function () {
      return this.engine.send.apply(this.engine, arguments)
    }

  // returns the address of the given address_index, first checking the cache
  HDWalletProvider.prototype.getAddress = function (idx) {
    if (!idx) { return this.addresses[0] }
    else { return this.addresses[idx] }
  }

  // returns the addresses cache
HDWalletProvider.prototype.getAddresses = function () {
  return this.addresses
}

module.exports = { HDWalletProvider }
