<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                v-if="!address"
                :class="'col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="color-white tomo-card__title tomo-card__title--big">Login</h4>
                <b-form
                    class="tomo-form tomo-form--setting"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        class="mb-4"
                        label="Wallet Provider"
                        label-for="provider">
                        <b-input-group>
                            <b-form-select
                                id="provider"
                                v-model="provider"
                                class="form-control"
                                @change="onChangeSelect">
                                <option value="coin98">Coin98</option>
                                <option value="viction">Viction</option>
                                <option value="ramper">Ramper</option>
                                <option value="metamask">Metamask/DApp Wallets</option>
                                <!-- <option
                                    value="tomowallet">TomoWallet (Recommended)</option> -->
                                <!-- <option
                                    value="custom">PrivateKey/MNEMONIC</option> -->
                                <option value="ledger">Ledger Wallet</option>
                                <option value="trezor">Trezor Wallet</option>
                                <!-- <option
                                    v-if="!isElectron"
                                    value="pantograph">Pantograph</option> -->
                            </b-form-select>
                            <!-- <small
                                v-if="provider !== 'metamask' && provider !== 'pantograph'"
                                class="form-text text-muted">Using node at {{ chainConfig.rpc }}.</small> -->
                        </b-input-group>
                    </b-form-group>
                    <!-- <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Network URL"
                        label-for="networks-custom">
                        <b-form-input
                            :class="getValidationClass('custom')"
                            v-model="networks.custom"
                            type="text" />
                        <span
                            v-if="$v.networks.custom.$dirty && !$v.networks.custom.required"
                            class="text-danger">Required field</span>
                        <span
                            v-else-if="$v.networks.custom.$dirty && !$v.networks.custom.localhostUrl"
                            class="text-danger">Wrong URL format</span>
                    </b-form-group> -->
                    <!-- <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Privatekey/MNEMONIC"
                        label-for="mnemonic">
                        <b-form-input
                            :class="getValidationClass('mnemonic')"
                            v-model="mnemonic"
                            autocomplete="off"
                            type="text" />
                        <span
                            v-if="$v.mnemonic.$dirty && !$v.mnemonic.required"
                            class="text-danger">Required field</span>
                    </b-form-group> -->
                    <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Select HD derivation path(MNEMONIC)"
                        label-for="hdPath">
                        <b-form-input
                            :class="getValidationClass('hdPath')"
                            :value="hdPath"
                            v-model="hdPath"
                            type="text" />
                        <span
                            v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                            class="text-danger">Required field</span>
                        <small class="form-text text-muted">To unlock the wallet, try paths
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'/0`)">m/44'/60'/0'/0</code> or
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'`)">m/44'/60'/0'</code> or
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/889'/0'/0`)">m/44'/889'/0'/0</code></small>
                    </b-form-group>

                    <b-form-group
                        v-if="provider === 'tomowallet'"
                        class="mb-4"
                        style="text-align: center">
                        <vue-qrcode
                            :options="{ size: 250 }"
                            :value="qrCode"
                            class="img-fluid text-center text-lg-right" />
                        <div v-if="mobileCheck">
                            <b-button
                                :href="qrCodeApp"
                                variant="primary">
                                Open in App
                            </b-button>
                        </div>
                        <div>
                            <b>In case you do not have TomoWallet, download here</b>
                        </div>
                        <div style="margin-top: 5px">
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/MvE1GV"
                                class="social-links__link">
                                <img src="/app/assets/img/appstore.png">
                            </a>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/4tFQzY"
                                class="social-links__link">
                                <img src="/app/assets/img/googleplay.png">
                            </a>
                        </div>
                    </b-form-group>
                    <b-form-group
                        v-if="provider === 'ledger'"
                        class="mb-4"
                        label="Select HD derivation path"
                        label-for="hdPath">
                        <b-form-input
                            :class="getValidationClass('hdPath')"
                            :value="hdPath"
                            v-model="hdPath"
                            type="text" />
                        <span
                            v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                            class="text-danger">Required field</span>
                        <small class="form-text text-muted">To unlock the wallet, try paths
                            <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'`)">m/44'/60'/0'</code>
                            or <code
                                class="hd-path"
                                @click="changePath(`m/44'/60'/0'/0`)">m/44'/60'/0'/0</code>
                            with Ethereum App,<br>
                            or try path <code
                                class="hd-path"
                                @click="changePath(`m/44'/889'/0'/0`)">m/44'/889'/0'/0</code>
                            with TomoChain App (on Ledger).</small>
                    </b-form-group>

                    <b-form-group
                        v-if="provider === 'trezor'"
                        class="mb-4"
                        label-for="hdPath">
                        <span>HD derivation path: </span>
                        <label class="ml-1"><b>m/44'/60'/0'/0</b></label>
                        <!-- <b-form-input
                            :class="getValidationClass('hdPath')"
                            :value="hdPath"
                            v-model="hdPath"
                            readonly
                            type="text" /> -->
                        <!-- <span
                            v-if="$v.hdPath.$dirty && !$v.hdPath.required"
                            class="text-danger">Required field</span> -->
                    </b-form-group>

                    <div v-if="!isReady && provider === 'metamask'">
                        <p>Please install &amp; login
                            <a
                                href="https://metamask.io/"
                                target="_blank">Metamask Extension</a>
                            then connect it to Viction Mainnet or Testnet.
                        </p>
                    </div>
                    <div v-if="!isReady && provider === 'pantograph'">
                        <p>Please install &amp; login
                            <a
                                href="https://pantograph.io/"
                                target="_blank">Pantograph Extension</a>
                            then connect it to Viction Mainnet or Testnet.
                        </p>
                    </div>
                    <div class="buttons text-right">
                        <b-button
                            v-if="provider !== 'tomowallet'"
                            type="submit"
                            variant="primary">Save</b-button>
                    </div>
                </b-form>
            </b-card>
            <b-card
                v-if="address"
                :class="'col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="h4 color-white tomo-card__title tomo-card__title--big">
                    Account Information</h4>
                <ul class="tomo-list list-unstyled">
                    <li class="tomo-list__item">
                        <i class="tm-wallet tomo-list__icon" />
                        <p class="tomo-list__text">
                            <router-link
                                :to="`/voter/${address}`"
                                class="text-truncate">
                                {{ address }}
                            </router-link>
                            <span>Address</span>
                        </p>
                    </li>
                    <li class="tomo-list__item">
                        <i class="tm-tomo2 tomo-list__icon" />
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ formatNumber(balance) }}
                                <span class="text-muted">{{ getCurrencySymbol() }}</span>
                            </p>
                            <span>Balance</span>
                        </div>
                    </li>
                </ul>
            </b-card>
            <b-card
                v-if="isReady && (aw || (wh.length > 0))"
                :class="'col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="h4 color-white tomo-card__title tomo-card__title--big">
                    Withdrawals</h4>
                <ul
                    v-for="(w, k, index) in withdraws"
                    :key="index"
                    class="tomo-list list-unstyled">
                    <li
                        v-if="w.blockNumber !== '0' && w.cap !== '0'"
                        class="tomo-list__item">
                        <p class="tomo-list__text">
                            <a :href="`${config.explorerUrl}/block/${w.blockNumber}`">
                                {{ w.blockNumber }}</a>
                            <span>Withdrawal Block Number</span>
                        </p>
                        <!-- <div class="tomo-list__text">
                            <p class="color-white mb-0">
                                {{ w.estimatedTime }}</p>
                            <span>Estimated Time</span>
                        </div> -->
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ w.cap }}
                                <span class="text-muted">{{ getCurrencySymbol() }}</span>
                            </p>
                            <span>Capacity</span>
                        </div>
                        <!-- <b-button
                            :disabled="w.blockNumber > chainConfig.blockNumber"
                            variant="primary"
                            @click="withdraw(w.blockNumber, k)">Withdraw</b-button> -->
                        <div class="tomo-list__text">
                            <b-button
                                :disabled="w.blockNumber > chainConfig.blockNumber"
                                class="float-right"
                                variant="primary"
                                @click="changeView(w, k)">Withdraw</b-button>
                        </div>
                    </li>
                </ul>
                <ul
                    v-for="(w, k, index) in wh"
                    :key="index"
                    class="tomo-list list-unstyled">
                    <li class="tomo-list__item">
                        <p class="tomo-list__text">
                            <a :href="`${config.explorerUrl}/tx/${w.tx}`">
                                {{ (w.tx || '').substring(0, 8) }}</a>
                            <span>Transaction</span>
                        </p>
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ w.cap }}
                                <span class="text-muted">{{ getCurrencySymbol() }}</span>
                            </p>
                            <span>Capacity</span>
                        </div>
                        <p class="tomo-list__text" />
                    </li>
                </ul>
            </b-card>
        </b-row>
        <div
            id="hdwalletModal"
            class="tomo-modal-light"
            style="display: none;">
            <div class="modal-backdrop">
                <div class="modal">
                    <header class="modal-header">
                        <slot name="header">
                            Please select the address you would like to interact with
                            <button
                                type="button"
                                class="close"
                                @click="closeModal">
                                x
                            </button>
                        </slot>
                    </header>
                    <section class="modal-body">
                        <slot name="hdAddress">
                            <div
                                v-for="(hdwallet, index) in hdWallets"
                                :key="index">
                                <label style="width: 100%; margin-bottom: 5px; line-height: 16px; cursor: pointer">
                                    <input
                                        :value="index"
                                        name="hdWallet"
                                        type="radio"
                                        autocomplete="off"
                                        style="width: 5%; float: left">
                                    <div style="width: 70%; float: left">
                                        {{ hdwallet.address }}
                                    </div>
                                    <div style="width: 20%; margin-left: 2%; float: left">
                                        {{ hdwallet.balance }} {{ getCurrencySymbol() }}
                                    </div>
                                </label>
                            </div>
                            <div
                                id="moreHdAddresses"
                                style="margin-top: 10px; cursor: pointer"
                                @click="moreHdAddresses">
                                More Addresses
                            </div>
                        </slot>
                    </section>
                    <footer class="modal-footer">
                        <slot name="footer">
                            <button
                                type="button"
                                class="btn btn-secondary"
                                @click="closeModal">
                                Cancel
                            </button>

                            <button
                                type="button"
                                class="btn btn-primary"
                                @click="setHdPath">
                                Unlock your wallet
                            </button>
                        </slot>
                    </footer>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { validationMixin } from 'vuelidate'
import axios from 'axios'
import {
    required, minLength
} from 'vuelidate/lib/validators'
// import localhostUrl from '../../validators/localhostUrl.js'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import store from 'store'
const walletAdapter = require('../walletAdapter.js')
// const HDWalletProvider = require('truffle-hdwallet-provider')
const { HDWalletProvider } = require('../../helpers')
const PrivateKeyProvider = require('truffle-privatekey-provider')
const defaultWalletNumber = 10

export default {
    name: 'App',
    components: {
        VueQrcode
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            mnemonic: '',
            hdPath: "m/44'/889'/0'/0", // HD DerivationPath of hardware wallet
            hdWallets: {}, // list of addresses in hardware wallet
            config: {},
            provider: walletAdapter.WALLET_TYPE.COIN98,
            address: '',
            withdraws: [],
            wh: [],
            aw: false,
            balance: 0,
            chainConfig: {},
            networks: {
                // mainnet: 'https://core.tomochain.com',
                rpc: 'https://testnet.tomochain.com',
                tomowallet: 'https://testnet.tomochain.com'
            },
            loading: false,
            qrCode: 'text',
            id: '',
            interval: '',
            qrCodeApp: '',
            gasPrice: null
        }
    },
    validations: {
        networks: {
            // custom: {
            //     required,
            //     localhostUrl
            // }
        },
        mnemonic: {
            required
        },
        hdPath: {
            required,
            minLength: minLength(12)
        }
    },
    computed: {
        mobileCheck: () => {
            const isAndroid = navigator.userAgent.match(/Android/i)
            const isIOS = navigator.userAgent.match(/iPhone|iPad|iPod/i)
            return (isAndroid || isIOS)
        }
    },
    watch: {},
    updated () { },
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        if (this.NetworkProvider) {
            this.provider = this.NetworkProvider
        }
        let self = this
        self.hdWallets = self.hdWallets || {}
        self.config = store.get('configMaster') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.networks.rpc = self.chainConfig.clientRpc

        self.setupAccount = async () => {
            let contract
            let account
            self.address = ''
            try {
                if (self.web3) {
                    try {
                        contract = self.TomoValidator
                        self.gasPrice = await self.web3.eth.getGasPrice()
                    } catch (error) {
                        self.$toasted.show('Make sure you choose correct Viction network.')
                    }
                }

                if (store.get('address') && self.isReady) {
                    account = store.get('address').toLowerCase()
                } else {
                    try {
                        account = this.$store.state.address
                            ? this.$store.state.address : (self.web3 ? await self.getAccount() : false)
                    } catch (e) {
                        self.$toasted.show(e.message, {
                            type: 'error'
                        })
                    }
                }

                if (!account) {
                    return false
                    // if (store.get('address') && self.provider !== 'custom') {
                    //     account = store.get('address')
                    // } else return false
                }

                self.address = account
                try {
                    const balanceBN = await self.web3.eth.getBalance(self.address)
                    self.balance = new BigNumber(balanceBN).div(10 ** 18)
                } catch (e) {
                    console.error('Cannot get balance')
                    self.$toasted.show('Cannot load balance')
                }

                let whPromise = axios.get(`/api/owners/${self.address}/withdraws?limit=100`)
                if (contract) {
                    // let blksPromise = contract.getWithdrawBlockNumbers.call({ from: account })
                    let blks = await contract.methods.getWithdrawBlockNumbers().call({ from: account })
                    // let blks = await contract.getWithdrawBlockNumbers.call({ from: account })

                    // const blks = await blksPromise
                    await Promise.all(blks.map(async (it, index) => {
                        let blk = new BigNumber(it).toString()
                        if (blk !== '0') {
                            self.aw = true
                        }
                        let wd = {
                            blockNumber: blk
                        }
                        wd.cap = new BigNumber(
                            // await contract.getWithdrawCap.call(blk, { from: account })
                            await contract.methods.getWithdrawCap(blk).call({ from: account })
                        ).div(10 ** 18).toFormat()
                        wd.estimatedTime = await self.getSecondsToHms(
                            (wd.blockNumber - self.chainConfig.blockNumber)
                        )
                        self.withdraws[index] = wd
                    }))
                }

                const wh = await whPromise

                // let wh = await axios.get(`/api/owners/${self.address}/withdraws`)
                self.wh = []
                wh.data.forEach(w => {
                    let it = {
                        cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                        tx: w.tx
                    }
                    self.wh.push(it)
                })
                self.isReady = true
            } catch (e) {
                console.log(e)
                self.$toasted.show(e, {
                    type: 'error'
                })
            }
        }
        if (self.provider === 'tomowallet' && !self.address) {
            const hasQRCOde = self.loginByQRCode()
            if (await hasQRCOde) {
                self.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
            }
        }
        await self.setupAccount()
    },
    mounted () { },
    methods: {
        getValidationClass: function (fieldName) {
            let field = this.$v[fieldName]
            if (typeof this.$v.networks[fieldName] !== 'undefined') {
                field = this.$v.networks[fieldName]
            }
            if (field) {
                return {
                    'is-invalid': field.$error
                }
            }
        },
        validate: function () {
            if (walletAdapter.SupportedWallets[this.provider]) {
                this.save()
            }

            this.$v.$touch()
            if (this.provider === 'custom' && !this.$v.mnemonic.$invalid) {
                this.save()
            }
            if (this.provider === 'ledger' && !this.$v.hdPath.$invalid) {
                this.selectHdPath()
            }
            if (this.provider === 'trezor' && !this.$v.hdPath.$invalid) {
                this.hdPath = "m/44'/60'/0'/0"
                this.selectHdPath()
            }
        },
        selectHdPath: async function (offset = 0, limit = defaultWalletNumber) {
            let self = this
            let wallets
            try {
                self.loading = true
                store.set('hdDerivationPath', self.hdPath)
                if (self.provider === 'trezor') {
                    await self.unlockTrezor()
                    wallets = await self.loadTrezorWallets(offset, limit)
                } else {
                    await self.unlockLedger()
                    wallets = await self.loadMultipleLedgerWallets(offset, limit)
                }
                if (Object.keys(wallets).length > 0) {
                    Object.assign(self.hdWallets, self.hdWallets, wallets)
                    document.getElementById('hdwalletModal').style.display = 'block'
                    self.loading = false
                }
            } catch (error) {
                console.log(error.message)
                self.loading = false
                self.$toasted.show(error.message || error, {
                    type: 'error'
                })
            }
        },
        save: async function () {
            store.clearAll()
            const self = this
            self.address = ''
            self.$store.state.address = null
            // clear old data
            self.withdraws = []
            self.aw = []
            self.wh = []
            var wjs = false
            self.loading = true
            try {
                let offset
                switch (self.provider) {
                case walletAdapter.WALLET_TYPE.COIN98:
                    wjs = await walletAdapter.loadCoin98Provider()
                    if (!wjs) {
                        self.$toasted.show('Please install Coin98 wallet', { type: 'error' })
                        return
                    }
                    break
                case walletAdapter.WALLET_TYPE.VICTION:
                    wjs = await walletAdapter.loadVictionProvider()
                    if (!wjs) {
                        self.$toasted.show('Please install Viction wallet', { type: 'error' })
                        return
                    }
                    break
                case walletAdapter.WALLET_TYPE.RAMPER:
                    wjs = await walletAdapter.loadRamperProvider()
                    if (!wjs) {
                        self.$toasted.show('Please install Ramper wallet', { type: 'error' })
                        return
                    }
                    break
                case walletAdapter.WALLET_TYPE.METAMASK:
                    wjs = await walletAdapter.loadMetamaskProvider()
                    if (!wjs) {
                        self.$toasted.show('Please install Metamask wallet', { type: 'error' })
                        return
                    }
                    break
                    // case 'pantograph':
                    //     if (window.tomoWeb3) {
                    //         var pp = window.tomoWeb3.currentProvider
                    //         wjs = new Web3(pp)
                    //     }
                    //     break
                case 'ledger':
                    // Object - HttpProvider
                    wjs = new Web3(new Web3.providers.HttpProvider(self.networks.rpc))
                    // Object - IpcProvider: The IPC provider is used node.js dapps when running a local node
                    // import net from 'net'
                    // wjs = new Web3(new Web3.providers.IpcProvider('~/.ethereum/geth.ipc', net))

                    // Object - WebsocketProvider: The Websocket provider is the standard for usage in legacy browsers.
                    // wjs = await ws.connect(self.networks.wss)
                    // wjs = new Web3(new Web3.providers.WebsocketProvider(self.chainConfig.ws))
                    // web3 version 0.2 haven't supported WebsocketProvider yet. (for web@1.0 only)
                    offset = document.querySelector('input[name="hdWallet"]:checked').value.toString()
                    store.set('hdDerivationPath', self.hdPath + '/' + offset)
                    break
                case 'trezor':
                    wjs = new Web3(new Web3.providers.HttpProvider(self.networks.rpc))
                    offset = document.querySelector('input[name="hdWallet"]:checked').value.toString()
                    store.set('hdDerivationPath', self.hdPath + '/' + offset)
                    store.set('offset', offset)
                    break
                default:
                    self.mnemonic = self.mnemonic.trim()
                    const walletProvider =
                            (self.mnemonic.indexOf(' ') >= 0)
                                ? new HDWalletProvider(
                                    self.mnemonic.trim(),
                                    self.chainConfig.rpc, 0, 1, self.hdPath)
                                : new PrivateKeyProvider(self.mnemonic, self.chainConfig.rpc)
                    wjs = new Web3(walletProvider)
                    break
                }
                await self.setupProvider(this.provider, wjs)
                await self.setupAccount()
                self.loading = false

                if (self.address) {
                    self.$store.state.address = self.address.toLowerCase()
                    if (walletAdapter.SupportedWallets[self.provider]) {
                        store.set('address', self.address.toLowerCase())
                        store.set('network', self.provider)
                    }
                    self.$bus.$emit('logged', 'user logged')
                    self.$toasted.show('Wallet Provider was changed successfully')
                }
            } catch (e) {
                self.loading = false
                self.$toasted.show('There are some errors when changing the network provider', {
                    type: 'error'
                })
                console.log(e)
            }
        },
        async loginByQRCode () {
            // generate qr code
            const { data } = await axios.get('/api/auth/generateLoginQR')
            this.id = data.id
            this.qrCode = encodeURI(
                'tomochain:login?message=' + data.message +
                '&submitURL=' + data.url
            )
            this.qrCodeApp = encodeURI(
                'tomochain://login?message=' + data.message +
                '&submitURL=' + data.url
            )
            return true
        },
        async getLoginResult () {
            // calling api every 2 seconds
            const { data } = await axios.get('/api/auth/getLoginResult?id=' + this.id)

            if (!data.error && data) {
                this.loading = true
                if (self.interval) {
                    clearInterval(self.interval)
                }
                try {
                    await this.getAccountInfo(data.user)
                } catch (e) {
                    self.$toasted.show(e.message, {
                        type: 'error'
                    })
                }
            }
        },
        async onChangeSelect (event) {
            switch (event) {
            case 'tomowallet':
                await this.loginByQRCode()
                this.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
                break
            case 'trezor':
                this.hdPath = "m/44'/60'/0'/0"
                break
            case 'ledger':
                this.hdPath = "m/44'/889'/0'/0"
                break
            default:
                if (this.interval) {
                    clearInterval(this.interval)
                }
                break
            }
        },
        async getAccountInfo (account) {
            const self = this
            let contract
            self.address = account
            self.$store.state.address = account
            const web3 = new Web3(new HDWalletProvider(
                '',
                self.chainConfig.rpc, 0, 1, self.hdPath))

            await self.setupProvider(this.provider, web3)
            try {
                // contract = await self.getTomoValidatorInstance()
                contract = self.TomoValidator
            } catch (error) {
                if (self.interval) {
                    clearInterval(self.interval)
                }
                self.$toasted.show('Make sure you choose correct Viction network.', {
                    type: 'error'
                })
            }

            self.web3.eth.getBalance(self.address, function (a, b) {
                self.balance = new BigNumber(b).div(10 ** 18).toFormat()
                if (a) {
                    console.log('got an error', a)
                }
            })
            if (contract) {
                // let blks = await contract.getWithdrawBlockNumbers.call({ from: account })
                let blks = await contract.methods.getWithdrawBlockNumbers().call({ from: account })

                await Promise.all(blks.map(async (it, index) => {
                    let blk = new BigNumber(it).toString()
                    if (blk !== '0') {
                        self.aw = true
                    }
                    let wd = {
                        blockNumber: blk
                    }
                    wd.cap = new BigNumber(
                        // await contract.getWithdrawCap.call(blk, { from: account })
                        await contract.methods.getWithdrawCap(blk).call({ from: account })
                    ).div(10 ** 18).toFormat()
                    wd.estimatedTime = await self.getSecondsToHms(
                        (wd.blockNumber - self.chainConfig.blockNumber)
                    )
                    self.withdraws[index] = wd
                }))
            }

            let wh = await axios.get(`/api/owners/${self.address}/withdraws?limit=100`)
            self.wh = []
            wh.data.forEach(w => {
                let it = {
                    cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                    tx: w.tx
                }
                self.wh.push(it)
            })
            self.isReady = true
            self.loading = false
            store.set('address', account.toLowerCase())
            store.set('network', self.provider)
            self.$bus.$emit('logged', 'user logged')
            self.$toasted.show('Network Provider was changed successfully')
            if (this.interval) {
                clearInterval(this.interval)
            }
        },
        changeView (w, k) {
            const txFee = new BigNumber(this.chainConfig.gas * this.gasPrice).div(10 ** 18)

            if (this.balance.isGreaterThanOrEqualTo(txFee)) {
                this.$router.push({
                    name: 'CandidateWithdraw',
                    params: {
                        address: this.address,
                        blockNumber: w.blockNumber,
                        capacity: w.cap,
                        index: k
                    }
                })
            } else {
                this.$toasted.show('Not enough VIC for transaction fee', {
                    type: 'info'
                })
            }
        },
        closeModal () {
            document.getElementById('hdwalletModal').style.display = 'none'
        },
        async setHdPath () {
            document.getElementById('hdwalletModal').style.display = 'none'
            await this.save()
        },
        async moreHdAddresses () {
            document.getElementById('moreHdAddresses').style.cursor = 'wait'
            document.body.style.cursor = 'wait'
            await this.selectHdPath(Object.keys(this.hdWallets).length, this.defaultWalletNumber)
            document.getElementById('moreHdAddresses').style.cursor = 'pointer'
            document.body.style.cursor = 'default'
        },
        changePath (path) {
            this.hdPath = path
        }
    }
}
</script>
