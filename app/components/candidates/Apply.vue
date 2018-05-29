<template>
    <div>
        <div
            class="container md-layout md-gutter md-alignment-top-center">
            <form
                novalidate
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90"
                @submit.prevent="validate()">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Become a Candidate</p>
                    </md-card-header>
                    <md-card-content>
                        <md-list>
                            <md-list-item>
                                <md-icon md-src="/app/assets/tomo.svg" />
                                <span class="md-list-item-text">You have to deposit at least 10,000 $TOMO</span>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>lock</md-icon>
                                <span class="md-list-item-text">Your deposit will be locked</span>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>arrow_upward</md-icon>
                                <span class="md-list-item-text">
                                    Coin holder is able to vote for you to become a validator
                                </span>
                            </md-list-item>
                            <md-list-item class="md-layout">
                                <div
                                    class="md-layout-item md-xlarge-size-70 md-large-size-70
                                    md-medium-size-70 md-small-size-50 md-xsmall-size-50">
                                    <md-field :class="getValidationClass('applyValue')">
                                        <label>Vote</label>
                                        <md-input
                                            v-model="applyValue"
                                            name="apply-value"
                                            min="0.1"
                                            step="0.1"
                                            type="number"/>
                                        <md-icon md-src="/app/assets/tomo.svg" />
                                        <md-tooltip>
                                            How much $TOMO do you want to deposit?</md-tooltip>
                                        <span
                                            v-if="!$v.applyValue.required"
                                            class="md-error">Required field</span>
                                        <span
                                            v-else-if="!$v.applyValue.minValue"
                                            class="md-error">Must be greater than 10,000 $TOMO</span>
                                    </md-field>
                                </div>
                            </md-list-item>
                            <md-list-item class="md-layout">
                                <div
                                    class="md-layout-item md-xlarge-size-70 md-large-size-70
                                    md-medium-size-70 md-small-size-50 md-xsmall-size-50">
                                    <md-field :class="getValidationClass('coinbase')">
                                        <label>Coinbase Address</label>
                                        <md-input
                                            v-model="coinbase"
                                            name="coinbase"
                                            type="string"/>
                                        <md-tooltip>
                                            What is your node coinbase address?</md-tooltip>
                                        <span
                                            v-if="!$v.coinbase.required"
                                            class="md-error">Required field</span>
                                        <span
                                            v-if="!$v.coinbase.coinbaseAddress"
                                            class="md-error">Wrong coinbase address format</span>
                                    </md-field>
                                </div>
                            </md-list-item>
                            <md-list-item class="md-layout">
                                <div
                                    class="md-layout-item md-xlarge-size-70 md-large-size-70
                                    md-medium-size-70 md-small-size-50 md-xsmall-size-50">
                                    <md-field :class="getValidationClass('nodeUrl')">
                                        <label>Node URL</label>
                                        <md-input
                                            v-model="nodeUrl"
                                            name="nodeurl"
                                            type="string"/>
                                        <md-tooltip>
                                            What is your node url?</md-tooltip>
                                        <span
                                            v-if="!$v.nodeUrl.required"
                                            class="md-error">Required field</span>
                                        <span
                                            v-if="!$v.nodeUrl.nodeUrl"
                                            class="md-error">Wrong node URL format</span>
                                    </md-field>
                                </div>
                            </md-list-item>
                        </md-list>
                    </md-card-content>
                    <md-card-actions>
                        <md-button
                            :disabled="this.$parent.showProgressBar"
                            class="md-raised md-accent"
                            @click="$router.go(-1)">Cancel</md-button>
                        <md-button
                            :disabled="this.$parent.showProgressBar"
                            class="md-raised md-primary"
                            type="submit"><md-icon>arrow_upward</md-icon> Apply</md-button>
                    </md-card-actions>
                </md-card>
            </form>
        </div>
        <div
            class="md-layout md-gutter md-alignment-center">
            <div
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Benefit</p>
                    </md-card-header>
                    <md-card-content>
                        <md-content>
                            Far far away, behind the word mountains,
                            far from the countries Vokalia and Consonantia,
                            there live the blind texts. Separated they live in
                            Bookmarksgrove right at the coast of the Semantics,
                            a large language ocean. A small river named Duden
                            flows by their place and supplies it with the necessary
                            regelialia. It is a paradisematic country, in which roasted
                            parts of sentences fly into your mouth. Even the all-powerful
                            Pointing has no control about the blind texts it is an almost
                            unorthographic life One day however a small line of blind text
                        </md-content>
                    </md-card-content>
                </md-card>
            </div>
        </div>
        <md-snackbar
            :md-active.sync="showSnackbar"
            md-position="left"
            md-persistent>
            <span>{{ snackBarMessage }}</span>
            <md-button
                class="md-primary"
                @click="showSnackbar = false">OK</md-button>
        </md-snackbar>
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
            showSnackbar: false,
            snackBarMessage: '',
            applyValue: 10000,
            coinbase: '',
            nodeUrl: ''
        }
    },
    validations: {
        applyValue: {
            required,
            minValue: minValue(10000)
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
                    'md-invalid': field.$invalid
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
                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully applied!'
                    : 'An error occurred while applying, please try again'
                setTimeout(() => {
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: `/candidate/${coinbase}` })
                    }
                }, 2000)
            } catch (e) {
                self.$parent.showProgressBar = false
                self.showSnackbar = true
                self.snackBarMessage = 'An error occurred while applying, please try again'
                console.log(e)
            }
        }
    }
}
</script>
