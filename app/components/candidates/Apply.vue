<template>
    <div>
        <md-empty-state
            v-if="this.$parent.isCandidate && !this.$parent.showProgressBar"
            md-icon="account_circle"
            md-label="You are a candidate"
            md-description="You are a candidate, so you do not need to apply again">
            <md-button
                :to="'/candidate/' + account"
                class="md-primary md-raised">Your Profile</md-button>
        </md-empty-state>
        <div
            v-if="!this.$parent.isCandidate"
            class="table-container md-layout md-gutter md-alignment-top-center">
            <form
                novalidate
                class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100"
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
                                <div class="md-layout-item md-xlarge-size-70 md-large-size-70 md-xsmall-size-100">
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
                        </md-list>
                    </md-card-content>
                    <md-card-actions>
                        <md-button
                            v-if="!this.$parent.isCandidate"
                            :disabled="this.$parent.showProgressBar"
                            class="md-raised md-primary"
                            type="submit"><md-icon>arrow_upward</md-icon> Apply</md-button>
                    </md-card-actions>
                </md-card>
            </form>
        </div>
        <div
            v-if="!this.$parent.isCandidate"
            class="md-layout md-gutter md-alignment-center">
            <div class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
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
export default {
    name: 'App',
    mixins: [validationMixin],
    data () {
        return {
            account: '',
            isNotReady: !this.web3,
            showSnackbar: false,
            snackBarMessage: '',
            applyValue: 10000
        }
    },
    validations: {
        applyValue: {
            required,
            minValue: minValue(10000)
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        try {
            let account = await this.getAccount()
            this.account = account
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
            try {
                if (self.isNotReady) {
                    self.$router.push({ path: '/setting' })
                }

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.propose({
                    from : account,
                    value: parseFloat(value) * 10 ** 18
                })
                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully applied!'
                    : 'An error occurred while applying, please try again'
                setTimeout(() => {
                    self.$parent.isCandidate = rs.tx !== 'undefined'
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: `/candidate/${account}` })
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
