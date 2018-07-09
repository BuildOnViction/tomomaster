<template>
    <div>
        <div
            class="container">
            <b-row
                align-v="center"
                align-h="center"
                class="m-0">
                <b-card class="col-12 col-lg-6 tomo-card tomo-card--lighter p-0">
                    <h2 class="h4 color-white tomo-card__title tomo-card__title--big">Become a Candidate</h2>
                    <ul class="tomo-list list-unstyled">
                        <li class="tomo-list__item">
                            <i class="tm-tomo tomo-list__icon" />
                            <span class="tomo-list__text">You have to deposit at least 50,000 $TOMO</span>
                        </li>
                        <li class="tomo-list__item">
                            <i class="tm-lock tomo-list__icon" />
                            <span class="tomo-list__text">Your deposit will be locked</span>
                        </li>
                        <li class="tomo-list__item">
                            <i class="tm-arrow-up tomo-list__icon" />
                            <span class="tomo-list__text">
                                Coin holder is able to vote for you to become a validator</span>
                        </li>
                    </ul>

                    <b-form
                        class="tomo-form tomo-form--apply"
                        novalidate
                        @submit.prevent="validate()">
                        <b-form-group
                            label="Vote"
                            label-for="apply-value"
                            description="How much $TOMO do you want to deposit?">
                            <b-input-group>
                                <b-form-input
                                    :class="getValidationClass('applyValue')"
                                    v-model="applyValue"
                                    name="apply-value"
                                    min="0.1"
                                    step="0.1"
                                    type="number"/>
                                <b-input-group-append>
                                    <i class="tm-tomo" />
                                </b-input-group-append>
                                <span
                                    v-if="$v.applyValue.$dirty && !$v.applyValue.required"
                                    class="text-danger">Required field</span>
                                <span
                                    v-else-if="$v.applyValue.$dirty && !$v.applyValue.minValue"
                                    class="text-danger">Must be greater than 50,000 $TOMO</span>
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
                        </b-form-group>
                        <b-form-group
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
                        </b-form-group>
                        <div class="buttons">
                            <b-button
                                :disabled="this.$parent.showProgressBar"
                                type="submit"
                                variant="primary">Apply</b-button>
                            <b-button
                                :disabled="this.$parent.showProgressBar"
                                to="/"
                                type="reset"
                                variant="secondary">Cancel</b-button>
                        </div>
                    </b-form>
                </b-card>
            </b-row>

            <b-row
                align-v="center"
                align-h="center"
                class="m-0">

                <b-card class="col-12 col-lg-6 tomo-card p-0">
                    <h2 class="h4 color-white tomo-card__title tomo-card__title--big">Benefit</h2>
                    <p class="tomo-form__text">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                        nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </b-card>
            </b-row>
        </div>
    </div>
</template>
<script>
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue
} from 'vuelidate/lib/validators'
import coinbaseAddress from '../../../validators/coinbaseAddress.js'
import nodeUrl from '../../../validators/nodeUrl.js'
export default {
    name: 'App',
    mixins: [validationMixin],
    data () {
        return {
            account: '',
            isReady: !!this.web3,
            applyValue: 50000,
            coinbase: '',
            nodeUrl: ''
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
        },
        nodeUrl: {
            required,
            nodeUrl
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            if (!self.web3 && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            let account = await self.getAccount()
            self.account = account
        } catch (e) {
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
            let coinbase = this.coinbase
            let nodeUrl = this.nodeUrl
            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                    throw Error('Web3 is not properly detected.')
                }

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.propose(coinbase, nodeUrl, {
                    from : account,
                    value: parseFloat(value) * 10 ** 18
                })
                let toastMessage = rs.tx ? 'You have successfully applied!'
                    : 'An error occurred while applying, please try again'

                self.$toasted.show(toastMessage)
                setTimeout(() => {
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: `/candidate/${coinbase}` })
                    }
                }, 2000)
            } catch (e) {
                self.$parent.showProgressBar = false
                self.$toasted.show('An error occurred while applying, please try again')
                console.log(e)
            }
        }
    }
}
</script>
