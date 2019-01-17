<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class="color-white tomo-card__title tomo-card__title--big">Become a Candidate</h4>
                <ul class="tomo-list list-unstyled">
                    <li class="tomo-list__item">
                        <i class="tm-tomo tomo-list__icon" />
                        <span class="tomo-list__text">You have to deposit at least 50,000 TOMO</span>
                    </li>
                    <li class="tomo-list__item">
                        <i class="tm-lock tomo-list__icon" />
                        <span class="tomo-list__text">Your deposit will be locked</span>
                    </li>
                    <li class="tomo-list__item">
                        <i class="tm-arrow-up tomo-list__icon" />
                        <span class="tomo-list__text">
                            Coin holders are able to vote for you to become a masternode</span>
                    </li>
                </ul>

                <b-form
                    class="tomo-form tomo-form--apply"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        :description="`How much TOMO do you want to deposit? TX fee: ${txFee} TOMO`"
                        label="Vote"
                        label-for="apply-value">
                        <b-input-group>
                            <number-input
                                :class="getValidationClass('applyValue')"
                                :min="0.1"
                                :step="0.1"
                                v-model="applyValue"
                                name="apply-value"/>
                            <b-input-group-append>
                                <i class="tm-tomo" />
                            </b-input-group-append>
                            <span
                                v-if="$v.applyValue.$dirty && !$v.applyValue.required"
                                class="text-danger">Required field</span>
                            <span
                                v-else-if="$v.applyValue.$dirty && !$v.applyValue.minValue"
                                class="text-danger">Must be greater than 50,000 TOMO</span>
                        </b-input-group>
                    </b-form-group>
                    <b-form-group
                        label="Coinbase Address"
                        label-for="coinbase"
                        description="What is your node coinbase address?">
                        <b-form-input
                            :class="getValidationClass('coinbase')"
                            v-model="coinbase"
                            name="coinbase"
                            autocomplete="off"
                            type="text"/>
                        <span
                            v-if="$v.coinbase.$dirty && !$v.coinbase.required"
                            class="text-danger">Required field</span>
                        <span
                            v-else-if="$v.coinbase.$dirty && !$v.coinbase.coinbaseAddress"
                            class="text-danger">Wrong coinbase address format</span>
                        <span
                            v-else-if="coinbaseError"
                            class="text-danger">
                            The masternode candidate account should be different from the depositing account.
                        </span>
                        <span
                            v-else-if="candidateError"
                            class="text-danger">
                            This coinbase address is already a candidate
                        </span>
                    </b-form-group>
                    <!--b-form-group
                        label="Node URL"
                        label-for="nodeurl"
                        description="What is your node url?">
                        <b-form-input
                            :class="getValidationClass('nodeUrl')"
                            v-model="nodeUrl"
                            name="coinbase"
                            type="text"/>
                        <span
                            v-if="$v.nodeUrl.$dirty && !$v.nodeUrl.required"
                            class="text-danger">Required field</span>
                        <span
                            v-else-if="$v.nodeUrl.$dirty && !$v.nodeUrl.nodeUrl"
                            class="text-danger">Wrong node URL format</span>
                    </b-form-group-->
                    <div class="buttons text-right">
                        <b-button
                            type="button"
                            variant="secondary"
                            @click="$router.go(-1)">Cancel</b-button>
                        <b-button
                            type="submit"
                            variant="primary">Apply</b-button>
                    </div>
                </b-form>
            </b-card>
        </b-row>
        <b-modal
            ref="applyModal"
            class="tomo-modal"
            centered
            title="Scan this QR code by TomoWallet"
            hide-footer>
            <div
                v-if="provider === 'tomowallet'"
                style="text-align: center">
                <vue-qrcode
                    :value="qrCode"
                    :options="{size: 200 }"
                    class="img-fluid text-center text-lg-right"/>
            </div>
            <b-btn
                class="mt-3"
                variant="outline-danger"
                block
                @click="hideModal">Close</b-btn>
        </b-modal>
    </div>
</template>
<script>
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue
} from 'vuelidate/lib/validators'
import coinbaseAddress from '../../../validators/coinbaseAddress.js'
// import nodeUrl from '../../../validators/nodeUrl.js'
import NumberInput from '../NumberInput.vue'
import BigNumber from 'bignumber.js'
import store from 'store'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import axios from 'axios'

export default {
    name: 'App',
    components: {
        NumberInput,
        VueQrcode
    },
    mixins: [validationMixin],
    data () {
        return {
            account: '',
            isReady: !!this.web3,
            applyValue: '50000',
            coinbase: '',
            // nodeUrl: '',
            loading: false,
            coinbaseError: false,
            provider: this.NetworkProvider || store.get('network') || null,
            showQR: true,
            qrCode: 'text',
            interval: null,
            candidateError: false,
            balance: 0,
            txFee: 0,
            gasPrice: null
        }
    },
    validations: {
        applyValue: {
            required,
            minValue: minValue(50000)
        },
        coinbase: {
            required,
            coinbaseAddress
        }
        /*
        nodeUrl: {
            required,
            nodeUrl
        },
        */
    },
    computed: { },
    watch: {},
    updated () {},
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        const self = this
        let account
        self.config = await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        try {
            self.isReady = !!self.web3
            self.gasPrice = await self.web3.eth.getGasPrice()
            self.txFee = new BigNumber(this.chainConfig.gas * self.gasPrice).div(10 ** 18).toString(10)
            if (!self.web3 && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            if (store.get('address')) {
                account = store.get('address').toLowerCase()
            } else {
                account = this.$store.state.walletLoggedIn
                    ? this.$store.state.walletLoggedIn : await self.getAccount()
            }
            self.account = account
        } catch (e) {
            self.$toasted.show(`You need login your account before voting`,
                {
                    type : 'default',
                    duration: 5000,
                    action : [
                        {
                            text : 'Login',
                            onClick : (e, toastObject) => {
                                self.$router.push({ path: '/setting' })
                            }
                        }
                    ]
                })
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        getValidationClass: function (fieldName) {
            const field = this.$v[fieldName]

            if (field) {
                return {
                    'is-invalid': field.$error
                }
            }
        },
        validate: async function () {
            this.$v.$touch()
            this.coinbaseError = false

            if (!this.$v.$invalid) {
                if (this.coinbase.toLowerCase() === this.account.toLowerCase()) {
                    this.coinbaseError = true
                } else {
                    // Check balance
                    const balanc = await this.web3.eth.getBalance(this.account)
                    this.balance = new BigNumber(balanc).div(10 ** 18)
                    const convertedAmount = new BigNumber(this.applyValue)

                    if (this.balance.isLessThan(convertedAmount)) {
                        this.$toasted.show(`Not enough TOMO`, {
                            type: 'error'
                        })
                        return false
                    }
                    const { data } = await axios.get('/api/candidates/' + this.coinbase + '/isCandidate')
                    if (data) {
                        this.candidateError = true
                    } else {
                        this.candidateError = false
                        if (this.provider !== 'tomowallet') {
                            await this.apply()
                        } else {
                            if (this.interval) {
                                clearInterval(this.interval)
                            }
                            await this.generateQR()
                            this.$refs.applyModal.show()
                        }
                    }
                }
            }
        },
        apply: async function () {
            let self = this
            let value = this.applyValue
            let coinbase = this.coinbase.toLowerCase()
            // let nodeUrl = this.nodeUrl

            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                    throw Error('Web3 is not properly detected.')
                }

                self.loading = true

                let contract = await self.getTomoValidatorInstance()
                let txParams = {
                    from : self.account,
                    value: self.web3.utils.toHex(new BigNumber(value).multipliedBy(10 ** 18).toString(10)),
                    gasPrice: self.web3.utils.toHex(self.gasPrice),
                    gas: self.web3.utils.toHex(self.chainConfig.gas),
                    gasLimit: self.web3.utils.toHex(self.chainConfig.gas),
                    chainId: self.chainConfig.networkId
                }
                let rs
                if (self.NetworkProvider === 'ledger' ||
                    self.NetworkProvider === 'trezor') {
                    let nonce = await self.web3.eth.getTransactionCount(self.account)
                    let dataTx = contract.propose.request(coinbase).params[0]
                    Object.assign(
                        dataTx,
                        dataTx,
                        txParams,
                        {
                            nonce: self.web3.utils.toHex(nonce)
                        }
                    )
                    let signature = await self.signTransaction(dataTx)
                    rs = await self.sendSignedTransaction(dataTx, signature)
                } else {
                    rs = await contract.propose(coinbase, txParams)
                }
                let toastMessage = rs.tx ? 'You have successfully applied!'
                    : 'An error occurred while applying, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    if (rs.tx) {
                        self.$router.push({ path: `/candidate/${coinbase}` })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
                self.$toasted.show(`An error occurred while applying, please fix it and try again: ${String(e)}`, {
                    type: 'error'
                })
                console.log(e)
                if (self.interval) {
                    clearInterval(self.interval)
                }
            }
        },
        hideModal () {
            this.$refs.applyModal.hide()
        },
        async generateQR () {
            const self = this
            const coinbase = self.coinbase.toLowerCase()

            if (self.interval) {
                clearInterval(self.interval)
            }

            try {
                const amount = new BigNumber(self.applyValue).toString(10)
                const body = {
                    action: 'propose',
                    voter: self.account.toLowerCase(),
                    candidate: coinbase,
                    amount
                }
                // call api to generate qr code
                const { data } = await axios.post(`/api/voters/generateQR`, body)

                self.message = data.message
                self.id = data.id
                self.qrCode = encodeURI(
                    'tomochain:propose?amount=' + amount +
                    '&candidate=' + coinbase +
                    '&submitURL=' + data.url
                )

                // set interval
                self.interval = setInterval(async () => {
                    self.verifyScannedQR()
                }, 3000)
            } catch (e) {
                console.log(e)
            }
        },
        async verifyScannedQR () {
            let self = this
            let coinbase = this.coinbase.toLowerCase()
            try {
                let { data } = await axios.get('/api/voters/getScanningResult?action=propose&id=' + self.id)

                if (!data.error) {
                    self.hideModal()
                    self.loading = true
                    if (data.tx) {
                        clearInterval(self.interval)
                        let toastMessage = data.tx ? 'You have successfully applied!'
                            : 'An error occurred while applying, please try again'
                        self.$toasted.show(toastMessage)
                        setTimeout(() => {
                            if (data.tx) {
                                self.loading = false
                                self.$router.push({ path: `/candidate/${coinbase}` })
                            }
                        }, 3000)
                    }
                }
            } catch (e) {
                console.log(e)
                self.$toasted.show(`An error occurred while excuting. ${String(e)}`, {
                    type: 'error'
                })
                clearInterval(self.interval)
            }
        }
    }
}
</script>
