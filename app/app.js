import Vue from 'vue'
import VueRouter from 'vue-router'
import VueAnalytics from 'vue-analytics'
import App from './App.vue'
import routes from './routes'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Web3 from 'web3'
// import { default as contract } from 'truffle-contract'
// import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json'
import Toasted from 'vue-toasted'
import axios from 'axios'
// import BigNumber from 'bignumber.js'
// import HighchartsVue from 'highcharts-vue'
// import Highcharts from 'highcharts'
// import stockInit from 'highcharts/modules/stock'
import VueClipboards from 'vue-clipboards'
import Vuex from 'vuex'
// import HDWalletProvider from 'truffle-hdwallet-provider'
import { HDWalletProvider } from '../helpers.js'
import localStorage from 'store'
// Libusb is included as a submodule.
// On Linux, you'll need libudev to build libusb.
// On Ubuntu/Debian: sudo apt-get install build-essential libudev-dev
// import Transport from '@ledgerhq/hw-transport-node-hid'

import Transport from '@ledgerhq/hw-transport-u2f' // for browser
import Eth from '@ledgerhq/hw-app-eth'
import TrezorConnect from 'trezor-connect'
import Transaction from 'ethereumjs-tx'
import * as HDKey from 'hdkey'
import * as ethUtils from 'ethereumjs-util'
import Meta from 'vue-meta'
import Helper from './utils'

Vue.use(Meta)
Vue.use(BootstrapVue)
Vue.use(VueClipboards)

Vue.use(Toasted, {
    position: 'bottom-right',
    theme: 'bubble',
    duration: 4000,
    action : {
        text : 'Dismiss',
        onClick : (e, toastObject) => {
            toastObject.goAway(0)
        }
    },
    singleton: true
})

// set trezor's manifest
TrezorConnect.manifest({
    email: 'admin@tomochain.com',
    appUrl: 'https://master.tomochain.com'
})

// stockInit(Highcharts)
// Vue.use(HighchartsVue)

// Vue.prototype.TomoValidator = contract(TomoValidatorArtifacts)
Vue.prototype.isElectron = !!(window && window.process && window.process.type)

Vue.prototype.setupProvider = async function (provider, wjs) {
    Vue.prototype.NetworkProvider = provider
    if (wjs instanceof Web3) {
        const config = await getConfig()
        localStorage.set('configMaster', config)
        Vue.prototype.web3 = wjs
        Vue.prototype.TomoValidator = new wjs.eth.Contract(
            Helper.TomoValidatorArtifacts.abi,
            config.blockchain.validatorAddress
        )
    }
}

Vue.prototype.getAccount = async function () {
    const provider = Vue.prototype.NetworkProvider || ''
    const wjs = Vue.prototype.web3
    let account
    switch (provider) {
    case 'metamask':
        // Request account access if needed - for metamask
        if (window.ethereum) {
            // await window.ethereum.enable()
            await window.ethereum.request({ method: 'eth_requestAccounts' })
        }
        account = (await wjs.eth.getAccounts())[0]
        break
    case 'pantograph':
        // Request account access if needed - for metamask
        if (window.tomochain) {
            await window.tomochain.enable()
        }
        account = (await wjs.eth.getAccounts())[0]
        break
    case 'tomowalletDapp':
        account = (await wjs.eth.getAccounts())[0]
        break
    case 'tomowallet':
        account = this.$store.state.address
        break
    case 'custom':
        account = (await wjs.eth.getAccounts())[0]
        break
    case 'ledger':
        try {
            if (!Vue.prototype.appEth) {
                let transport = await new Transport()
                Vue.prototype.appEth = await new Eth(transport)
            }
            let ethAppConfig = await Vue.prototype.appEth.getAppConfiguration()
            if (!ethAppConfig.arbitraryDataEnabled) {
                throw new Error(`Please go to App Setting
                    to enable contract data and display data on your device!`)
            }
            let result = await Vue.prototype.appEth.getAddress(
                localStorage.get('hdDerivationPath')
            )
            account = result.address
        } catch (error) {
            console.log(error)
            throw error
        }
        break
    case 'trezor':
        const payload = Vue.prototype.trezorPayload || localStorage.get('trezorPayload')
        const offset = localStorage.get('offset')
        account = Vue.prototype.HDWalletCreate(
            payload,
            offset
        )
        localStorage.set('trezorPayload', { xpub: payload.xpub })
        break
    default:
        break
    }
    if (!account || account.length <= 0) {
        console.log(`Couldn't get any accounts! Make sure
            your Ethereum client is configured correctly.`)
    }
    return account
}

Vue.prototype.loadMultipleLedgerWallets = async function (offset, limit) {
    let u2fSupported = await Transport.isSupported()
    if (!u2fSupported) {
        throw new Error(`U2F not supported in this browser. 
                Please try using Google Chrome with a secure (SSL / HTTPS) connection!`)
    }
    await Vue.prototype.detectNetwork('ledger')
    if (!Vue.prototype.appEth) {
        let transport = await Transport.create()
        Vue.prototype.appEth = await new Eth(transport)
    }
    const payload = Vue.prototype.ledgerPayload
    let web3 = Vue.prototype.web3
    let balance = 0
    let convertedAddress
    let wallets = {}

    for (let i = offset; i < (offset + limit); i++) {
        convertedAddress = Vue.prototype.HDWalletCreate(payload, i)
        balance = await web3.eth.getBalance(convertedAddress)
        wallets[i] = {
            address: convertedAddress,
            balance: parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2)
        }
    }
    Vue.prototype.ledgerPayload = ''
    return wallets
}

Vue.prototype.unlockTrezor = async () => {
    try {
        const result = await TrezorConnect.getPublicKey({
            path: localStorage.get('hdDerivationPath')
        })
        Vue.prototype.trezorPayload = result.payload
    } catch (error) {
        console.log(error)
        throw error
    }
}

Vue.prototype.unlockLedger = async () => {
    try {
        if (!Vue.prototype.appEth) {
            let transport = await Transport.create()
            Vue.prototype.appEth = await new Eth(transport)
        }
        const path = localStorage.get('hdDerivationPath')

        const result = await Vue.prototype.appEth.getAddress(
            path,
            false,
            true
        )
        Vue.prototype.ledgerPayload = result
    } catch (error) {
        console.log(error)
        throw error
    }
}

Vue.prototype.HDWalletCreate = (payload, index) => {
    const provider = Vue.prototype.NetworkProvider
    let derivedKey
    if (provider === 'trezor') {
        const xpub = payload.xpub
        const hdWallet = HDKey.fromExtendedKey(xpub)
        derivedKey = hdWallet.derive('m/' + index)
    } else {
        const pubKey = payload.publicKey
        const chainCode = payload.chainCode
        const hdkey = new HDKey()
        hdkey.publicKey = Buffer.from(pubKey, 'hex')
        hdkey.chainCode = Buffer.from(chainCode, 'hex')
        derivedKey = hdkey.derive('m/' + index)
    }
    let pubKey = ethUtils.bufferToHex(derivedKey.publicKey)
    const buff = ethUtils.publicToAddress(pubKey, true)

    return ethUtils.bufferToHex(buff)
}

Vue.prototype.loadTrezorWallets = async (offset, limit) => {
    try {
        const wallets = {}
        const payload = Vue.prototype.trezorPayload
        if (payload && !payload.error) {
            let convertedAddress
            let balance
            let web3
            if (!Vue.prototype.web3) {
                await Vue.prototype.detectNetwork('trezor')
            }
            web3 = Vue.prototype.web3
            for (let i = offset; i < (offset + limit); i++) {
                convertedAddress = Vue.prototype.HDWalletCreate(payload, i)
                balance = await web3.eth.getBalance(convertedAddress)
                wallets[i] = {
                    address: convertedAddress,
                    balance: parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2)
                }
            }
            return wallets
        } else {
            throw payload.error || 'Something went wrong'
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

Vue.prototype.formatNumber = Helper.formatNumber

Vue.prototype.formatCurrencySymbol = Helper.formatCurrencySymbol

Vue.prototype.getCurrencySymbol = Helper.getCurrencySymbol

Vue.prototype.checkLongNumber = Helper.checkLongNumber

Vue.prototype.formatBigNumber = Helper.formatBigNumber

const getConfig = Vue.prototype.appConfig = async function () {
    let config = await axios.get('/api/config')
    return config.data
}

Vue.prototype.getSecondsToHms = Helper.getSecondsToHms

Vue.prototype.serializeQuery = Helper.serializeQuery

Vue.prototype.truncate = Helper.truncate

Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'history',
    routes
})

router.beforeEach(async (to, from, next) => {
    const provider = Vue.prototype.NetworkProvider || localStorage.get('network') || null
    await Vue.prototype.detectNetwork(provider)
    next()
})

getConfig().then((config) => {
    // let provider = 'tomowallet'
    // var web3js = new Web3(new Web3.providers.HttpProvider(config.blockchain.internalRpc))
    // Vue.prototype.setupProvider(provider, web3js)
    localStorage.set('configMaster', config)
    Vue.use(VueAnalytics, {
        id: config.GA,
        linkers: ['master.tomochain.com'],
        router,
        autoTraking: {
            screenView: true
        }
    })
}).catch(e => {
    console.log(e)
    throw e
})

Vue.use(Vuex)

const store = new Vuex.Store({
    state: {
        address: null
    }
})
Vue.prototype.detectNetwork = async function (provider) {
    try {
        let wjs = this.web3
        const config = localStorage.get('configMaster') || await getConfig()
        const chainConfig = config.blockchain
        if (!wjs) {
            switch (provider) {
            case 'metamask':
                if (window.ethereum) {
                    let p = window.ethereum
                    wjs = new Web3(p)
                }
                break
            case 'tomowalletDapp':
                if (window.web3) {
                    if (window.web3.currentProvider) {
                        let p = window.web3.currentProvider
                        wjs = new Web3(p)
                    } else {
                        wjs = window.web3
                    }
                }
                break
            case 'pantograph':
                if (window.tomoWeb3) {
                    if (window.tomoWeb3.currentProvider) {
                        let pp = window.tomoWeb3.currentProvider
                        wjs = new Web3(pp)
                    } else {
                        wjs = window.tomoWeb3
                    }
                }
                break
            case 'tomowallet':
                wjs = new Web3(new HDWalletProvider(
                    '',
                    chainConfig.rpc, 0, 1, true))
                break
            case 'trezor':
            case 'ledger':
                // wjs = new Web3(new Web3.providers.WebsocketProvider(chainConfig.ws))
                wjs = new Web3(new Web3.providers.HttpProvider(chainConfig.rpc))
                break
            default:
                break
            }
            await this.setupProvider(provider, await wjs)
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * @return TomoValidator contract instance
 */
Vue.prototype.getTomoValidatorInstance = async function () {
    // workaround for web3 version 1.0.0
    // @link https://github.com/trufflesuite/truffle-contract/issues/57#issuecomment-331300494
    if (typeof Vue.prototype.TomoValidator.currentProvider.sendAsync !== 'function') {
        Vue.prototype.TomoValidator.currentProvider.sendAsync = function () {
            return Vue.prototype.TomoValidator.currentProvider.send.apply(
                Vue.prototype.TomoValidator.currentProvider,
                arguments
            )
        }
    }
    let instance = await Vue.prototype.TomoValidator.deployed()
    return instance
}

/**
 * @param object txParams
 * @return object signature {r, s, v}
 */
Vue.prototype.signTransaction = async function (txParams) {
    const path = localStorage.get('hdDerivationPath')
    const provider = Vue.prototype.NetworkProvider
    let signature
    if (provider === 'ledger') {
        const config = localStorage.get('configMaster') || await getConfig()
        const chainConfig = config.blockchain
        const rawTx = new Transaction(txParams)
        rawTx.v = Buffer.from([chainConfig.networkId])
        const serializedRawTx = rawTx.serialize().toString('hex')
        signature = await Vue.prototype.appEth.signTransaction(
            path,
            serializedRawTx
        )
    }
    if (provider === 'trezor') {
        try {
            const result = await TrezorConnect.ethereumSignTransaction({
                path,
                transaction: txParams
            })
            signature = result.payload
        } catch (error) {
            console.log(error)
            throw error
        }
    }
    return signature
}

/**
 * @param object txParams
 * @param object signature {r,s,v}
 * @return transactionReceipt
 */
Vue.prototype.sendSignedTransaction = function (txParams, signature) {
    return new Promise((resolve, reject) => {
        try {
            // "hexify" the keys
            Object.keys(signature).map((key, _) => {
                if (signature[key].startsWith('0x')) {
                    return signature[key]
                } else signature[key] = '0x' + signature[key]
            })
            let txObj = Object.assign({}, txParams, signature)
            let tx = new Transaction(txObj)
            let serializedTx = '0x' + tx.serialize().toString('hex')
            // web3 v0.2, method name is sendRawTransaction
            // You are using web3 v1.0. The method was renamed to sendSignedTransaction.
            Vue.prototype.web3.eth.sendSignedTransaction(
                serializedTx
            ).on('transactionHash', txHash => resolve(txHash))
                .catch(error => reject(error))
        } catch (error) {
            reject(error)
        }
    })
}

Vue.prototype.signMessage = async function (message) {
    try {
        const path = localStorage.get('hdDerivationPath')
        const provider = Vue.prototype.NetworkProvider
        let result
        switch (provider) {
        case 'ledger':
            const signature = await Vue.prototype.appEth.signPersonalMessage(
                path,
                Buffer.from(message).toString('hex')
            )
            let v = signature['v'] - 27
            v = v.toString(16)
            if (v.length < 2) {
                v = '0' + v
            }
            result = '0x' + signature['r'] + signature['s'] + v
            break
        case 'trezor':
            const sig = await TrezorConnect.ethereumSignMessage({
                path,
                message
            })
            result = '0x' + sig.payload.signature || ''
            break
        default:
            break
        }
        return result
    } catch (error) {
        console.log(error)
        throw error
    }
}

const EventBus = new Vue()

Vue.prototype.$bus = EventBus

new Vue({ // eslint-disable-line no-new
    el: '#app',
    store,
    router: router,
    components: { App },
    template: '<App/>'
})
