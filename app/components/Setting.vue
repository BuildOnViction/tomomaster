<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="color-white tomo-card__title tomo-card__title--big">Login</h4>
                <b-form
                    class="tomo-form tomo-form--setting"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        class="mb-4"
                        label="Network Provider"
                        label-for="provider">
                        <b-input-group>
                            <b-form-select
                                id="provider"
                                v-model="provider"
                                @change="onChangeSelect">
                                <option
                                    value="tomowallet"
                                    selected>TomoWallet</option>
                                <option value="custom">PrivateKey/MNEMONIC</option>
                                <option
                                    v-if="!isElectron"
                                    value="metamask">Metamask</option>
                            </b-form-select>
                            <small
                                class="form-text text-muted">Using node at {{ chainConfig.rpc }}.</small>
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
                    <b-form-group
                        v-if="provider === 'custom'"
                        class="mb-4"
                        label="Privatekey/MNEMONIC"
                        label-for="mnemonic">
                        <b-form-input
                            :class="getValidationClass('mnemonic')"
                            v-model="mnemonic"
                            type="text" />
                        <span
                            v-if="$v.mnemonic.$dirty && !$v.mnemonic.required"
                            class="text-danger">Required field</span>
                    </b-form-group>

                    <b-form-group
                        v-if="provider === 'tomowallet'"
                        class="mb-4"
                        style="text-align: center">
                        <vue-qrcode
                            :options="{size: 250 }"
                            :value="qrCode"
                            class="img-fluid text-center text-lg-right"/>
                        <div
                            style="margin-top: 5px">
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/MvE1GV"
                                class="social-links__link">
                                <img src="/app/assets/img/appstore.png" >
                            </a>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://goo.gl/4tFQzY"
                                class="social-links__link">
                                <img src="/app/assets/img/googleplay.png" >
                            </a>
                        </div>
                    </b-form-group>

                    <div
                        v-if="!isReady && provider === 'metamask'">
                        <p>Please install &amp; login
                            <a
                                href="http://bitly.com/2gmvrGG"
                                target="_blank">Metamask Extension</a>
                            then connect it to Tomochain Mainnet or Testnet.</p>
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
                        <i class="tm-tomo tomo-list__icon" />
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ balance }}
                            <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
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
                        v-if="w.blockNumber !== '0'"
                        class="tomo-list__item">
                        <p class="tomo-list__text">
                            <a :href="`${config.explorerUrl}/blocks/${w.blockNumber}`">
                                {{ w.blockNumber }}</a>
                            <span>Withdrawal Block Number</span>
                        </p>
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">
                                {{ w.estimatedTime }}</p>
                            <span>Estimated Time</span>
                        </div>
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ w.cap }}
                            <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                            <span>Capacity</span>
                        </div>
                        <!-- <b-button
                            :disabled="w.blockNumber > chainConfig.blockNumber"
                            variant="primary"
                            @click="withdraw(w.blockNumber, k)">Withdraw</b-button> -->
                        <b-button
                            :disabled="w.blockNumber > chainConfig.blockNumber"
                            variant="primary"
                            @click="changeView(w, k)">Withdraw</b-button>
                    </li>
                </ul>
                <ul
                    v-for="(w, k, index) in wh"
                    :key="index"
                    class="tomo-list list-unstyled">
                    <li
                        class="tomo-list__item">
                        <p class="tomo-list__text">
                            <a :href="`${config.explorerUrl}/txs/${w.tx}`">
                                {{ (w.tx || '').substring(0,8) }}</a>
                            <span>Transaction</span>
                        </p>
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ w.cap }}
                            <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                            <span>Capacity</span>
                        </div>
                    </li>
                </ul>
            </b-card>
        </b-row>
    </div>
</template>
<script>
import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { validationMixin } from 'vuelidate'
import axios from 'axios'
import {
    required
} from 'vuelidate/lib/validators'
// import localhostUrl from '../../validators/localhostUrl.js'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import store from 'store'
const HDWalletProvider = require('truffle-hdwallet-provider')
const PrivateKeyProvider = require('truffle-privatekey-provider')
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
            config: {},
            provider: 'tomowallet',
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
            interval: ''
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
        }
    },
    computed: {},
    watch: {},
    updated () {},
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        this.provider = this.NetworkProvider || 'tomowallet'
        let self = this
        self.config = await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.networks.rpc = self.chainConfig.rpc

        self.setupAccount = async () => {
            let contract
            let account
            try {
                if (!self.web3 && self.NetworkProvider === 'metamask') {
                    throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
                }
                if (self.web3) {
                    try {
                        contract = await self.TomoValidator.deployed()
                    } catch (error) {
                        throw Error('Make sure you choose correct tomochain network.')
                    }
                }

                if (store.get('address')) {
                    account = store.get('address').toLowerCase()
                } else {
                    account = this.$store.state.walletLoggedIn
                        ? this.$store.state.walletLoggedIn : (self.web3 ? await self.getAccount() : false)
                }

                if (!account) {
                    if (store.get('address') && self.provider !== 'custom') {
                        account = store.get('address')
                    } else return false
                }

                self.address = account
                self.web3.eth.getBalance(self.address, function (a, b) {
                    self.balance = new BigNumber(b).div(10 ** 18).toFormat()
                    if (a) {
                        console.log('got an error', a)
                    }
                })
                if (contract) {
                    let blks = await contract.getWithdrawBlockNumbers.call({ from: account })

                    await Promise.all(blks.map(async (it, index) => {
                        let blk = new BigNumber(it).toString()
                        if (blk !== '0') {
                            self.aw = true
                        }
                        let wd = {
                            blockNumber: blk
                        }
                        wd.cap = new BigNumber(
                            await contract.getWithdrawCap.call(blk, { from: account })
                        ).div(10 ** 18).toFormat()
                        wd.estimatedTime = await self.getSecondsToHms(
                            (wd.blockNumber - self.chainConfig.blockNumber)
                        )
                        self.withdraws[index] = wd
                    }))
                }

                let wh = await axios.get(`/api/owners/${self.address}/withdraws`)
                self.wh = []
                wh.data.forEach(w => {
                    let it = {
                        cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                        tx: w.tx
                    }
                    self.wh.push(it)
                })
                self.isReady = true
                self.$toasted.show('Network Provider was changed successfully')
            } catch (e) {
                console.log(e)
                self.$toasted.show(e, {
                    type : 'error'
                })
            }
        }
        if (self.provider === 'tomowallet') {
            const hasQRCOde = self.loginByQRCode()
            if (await hasQRCOde) {
                self.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
            }
        }
        await self.setupAccount()
    },
    mounted () {},
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
            if (this.provider === 'metamask') {
                this.save()
            }

            this.$v.$touch()

            if (!this.$v.$invalid) {
                this.save()
            }
        },
        save: async function () {
            store.clearAll()
            const self = this
            var wjs = false
            self.loading = true
            try {
                if (self.provider === 'metamask') {
                    if (window.web3) {
                        var p = window.web3.currentProvider
                        wjs = new Web3(p)
                    }
                } else {
                    const walletProvider =
                        (self.mnemonic.indexOf(' ') >= 0)
                            ? new HDWalletProvider(
                                self.mnemonic,
                                self.chainConfig.rpc, 0, 1, true, "m/44'/889'/0'/0/")
                            : new PrivateKeyProvider(self.mnemonic, self.chainConfig.rpc)

                    wjs = new Web3(walletProvider)
                }

                await self.setupProvider(this.provider, wjs)

                await self.setupAccount()
                self.loading = false
                self.$store.state.walletLoggedIn = null

                store.set('address', self.address)
                store.set('network', self.provider)
            } catch (e) {
                self.loading = false
                self.$toasted.show('There are some errors when changing the network provider', {
                    type : 'error'
                })
                console.log(e)
            }
        },
        withdraw: async function (blockNumber, index) {
            let self = this
            let contract = await self.TomoValidator.deployed()
            let account = await self.getAccount()
            self.loading = true
            try {
                let wd = await contract.withdraw(String(blockNumber), String(index), {
                    from: account,
                    gasPrice: 2500,
                    gas: 2000000
                })
                let toastMessage = wd.tx ? 'You have successfully withdrawed!'
                    : 'An error occurred while withdrawing, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    if (wd.tx) {
                        self.$router.push({ path: `/setting` })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
            }
        },
        async loginByQRCode () {
            // generate qr code
            const { data } = await axios.get('/api/config/generateLoginQR')
            this.id = data.id
            this.qrCode = encodeURI(
                'tomochain:login?message=' + data.message +
                '&submitURL=' + data.url + data.id
            )
            return true
        },
        async getLoginResult () {
            // calling api every 2 seconds
            const { data } = await axios.post('/api/config/getLoginResult', { messId: this.id })

            if (!data.error && data) {
                this.loading = true
                if (self.interval) {
                    clearInterval(self.interval)
                }
                await this.getAccountInfo(data.user)
            }
        },
        async onChangeSelect (event) {
            if (event === 'tomowallet') {
                await this.loginByQRCode()
                this.interval = setInterval(async () => {
                    await this.getLoginResult()
                }, 3000)
            } else {
                if (this.interval) {
                    clearInterval(this.interval)
                }
            }
        },
        async getAccountInfo (account) {
            const self = this
            let contract
            self.address = account
            self.$store.state.walletLoggedIn = account
            const web3 = new Web3(new HDWalletProvider(
                '',
                self.chainConfig.rpc, 0, 1, true, "m/44'/889'/0'/0/"))

            await self.setupProvider(this.provider, web3)
            try {
                contract = await self.TomoValidator.deployed()
            } catch (error) {
                if (self.interval) {
                    clearInterval(self.interval)
                }
                self.$toasted.show('Make sure you choose correct tomochain network.', {
                    type : 'error'
                })
            }

            self.web3.eth.getBalance(self.address, function (a, b) {
                self.balance = new BigNumber(b).div(10 ** 18).toFormat()
                if (a) {
                    console.log('got an error', a)
                }
            })
            if (contract) {
                let blks = await contract.getWithdrawBlockNumbers.call({ from: account })

                await Promise.all(blks.map(async (it, index) => {
                    let blk = new BigNumber(it).toString()
                    if (blk !== '0') {
                        self.aw = true
                    }
                    let wd = {
                        blockNumber: blk
                    }
                    wd.cap = new BigNumber(
                        await contract.getWithdrawCap.call(blk, { from: account })
                    ).div(10 ** 18).toFormat()
                    wd.estimatedTime = await self.getSecondsToHms(
                        (wd.blockNumber - self.chainConfig.blockNumber)
                    )
                    self.withdraws[index] = wd
                }))
            }

            let wh = await axios.get(`/api/owners/${self.address}/withdraws`)
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
            store.set('address', account)
            store.set('network', self.provider)
            if (this.interval) {
                clearInterval(this.interval)
            }
        },
        changeView (w, k) {
            this.$router.push({ name: 'CandidateWithdraw',
                params: {
                    address: this.address,
                    blockNumber: w.blockNumber,
                    capacity: w.cap,
                    index: k
                }
            })
        }
    }
}
</script>
