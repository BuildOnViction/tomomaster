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
                        label="Vote"
                        label-for="apply-value"
                        description="How much TOMO do you want to deposit? TX fee: 0.0000000000525 TOMO">
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
                            The masternode candidate account should bedifferent from the depositing account.
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
import store from 'store'

export default {
    name: 'App',
    components: {
        NumberInput
    },
    mixins: [validationMixin],
    data () {
        return {
            account: '',
            isReady: !!this.web3,
            applyValue: 50000,
            coinbase: '',
            // nodeUrl: '',
            loading: false,
            coinbaseError: false
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
    created: async function () {
        let self = this
        let account
        try {
            self.isReady = !!self.web3
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
        validate: function () {
            this.$v.$touch()

            if (!this.$v.$invalid) {
                this.apply()
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

                if (coinbase.toLowerCase() === self.account.toLowerCase()) {
                    self.loading = false
                    self.coinbaseError = true
                    return false
                }
                let contract = await self.getTomoValidatorInstance()
                let txParams = {
                    from : self.account,
                    value: parseFloat(value) * 10 ** 18,
                    gasPrice: 2500,
                    gas: 2000000
                }
                let rs
                if (self.NetworkProvider === 'ledger') {
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
            }
        }
    }
}
</script>
