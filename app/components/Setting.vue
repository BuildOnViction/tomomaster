<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="color-white tomo-card__title tomo-card__title--big">Settings</h4>
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
                                v-model="provider">
                                <option
                                    v-if="!isElectron"
                                    value="metamask">Metamask</option>
                                <option value="testnet">Tomochain Testnet</option>
                                <option value="custom">Custom Network</option>
                            </b-form-select>
                            <small
                                v-if="provider === 'testnet'"
                                class="form-text text-muted">Using node at https://testnet.tomochain.com.</small>
                        </b-input-group>
                    </b-form-group>
                    <b-form-group
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
                    </b-form-group>
                    <b-form-group
                        v-if="provider !== 'metamask'"
                        class="mb-4"
                        label="MNEMONIC/PrivateKey"
                        label-for="mnemonic">
                        <b-form-input
                            :class="getValidationClass('mnemonic')"
                            v-model="mnemonic"
                            type="text" />
                        <span
                            v-if="$v.mnemonic.$dirty && !$v.mnemonic.required"
                            class="text-danger">Required field</span>
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
                            type="submit"
                            variant="primary">Save</b-button>
                    </div>
                </b-form>
            </b-card>
            <b-card
                v-if="isReady"
                class="col-12 col-md-8 col-lg-7 tomo-card tomo-card--lighter p-0">
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
                    Withdraws</h4>
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
                            <span>Block Number</span>
                        </p>
                        <div class="tomo-list__text">
                            <p class="color-white mb-0">{{ w.cap }}
                            <span class="text-muted">{{ getCurrencySymbol() }}</span></p>
                            <span>Capacity</span>
                        </div>
                        <b-button
                            variant="primary"
                            @click="withdraw(w.blockNumber, k)">Withdraw</b-button>
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
import localhostUrl from '../../validators/localhostUrl.js'
const HDWalletProvider = require('truffle-hdwallet-provider')
const PrivateKeyProvider = require('truffle-privatekey-provider')
export default {
    name: 'App',
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            mnemonic: '',
            config: {},
            provider: 'metamask',
            address: '',
            withdraws: [],
            wh: [],
            aw: false,
            balance: 0,
            networks: {
                // mainnet: 'https://core.tomochain.com',
                testnet: 'https://testnet.tomochain.com',
                custom: 'http://localhost:8545'
            },
            loading: false
        }
    },
    validations: {
        networks: {
            custom: {
                required,
                localhostUrl
            }
        },
        mnemonic: {
            required
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        this.provider = this.NetworkProvider
        let self = this
        self.config = await self.appConfig()

        self.setupAccount = async () => {
            try {
                if (!self.web3 && self.NetworkProvider === 'metamask') {
                    throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
                }
                let account = await self.getAccount()
                self.address = account
                self.web3.eth.getBalance(self.address, function (a, b) {
                    self.balance = new BigNumber(b).div(10 ** 18).toFormat()
                    if (a) {
                        console.log('got an error', a)
                    }
                })
                let contract = await self.TomoValidator.deployed()
                let blks = await contract.getWithdrawBlockNumbers.call({ from: account })
                blks.forEach(async it => {
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
                    self.withdraws.push(wd)
                })
                let wh = await axios.get(`/api/owners/${self.address}/withdraws`)
                self.wh = []
                wh.data.forEach(w => {
                    let it = {
                        cap: new BigNumber(w.capacity).div(10 ** 18).toFormat(),
                        tx: w.tx
                    }
                    self.wh.push(it)
                })
            } catch (e) {
                console.log(e)
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
        save: function () {
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
                            ? new HDWalletProvider(self.mnemonic, self.networks[self.provider])
                            : new PrivateKeyProvider(self.mnemonic, self.networks[self.provider])

                    wjs = new Web3(walletProvider)
                }

                self.setupProvider(this.provider, wjs)

                setTimeout(async () => {
                    self.loading = false
                    self.$toasted.show('Network Provider was changed successfully')
                    await self.setupAccount()
                }, 2000)
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
                console.log('==>', blockNumber, index)
                let wd = await contract.withdraw(String(blockNumber), String(index), { from: account })
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
        }
    }
}
</script>
