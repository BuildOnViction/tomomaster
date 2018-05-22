<template>
    <div>
        <div class="table-container md-layout md-gutter md-alignment-center">
            <form
                novalidate
                class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100"
                @submit.prevent="validate()">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Unvoting</p>
                        <div class="md-subhead">You will receive $TOMO after unvoting</div>
                    </md-card-header>

                    <md-card-content>
                        <md-list class="md-double-line">
                            <md-list-item>
                                <md-icon>how_to_vote</md-icon>
                                <div class="md-list-item-text">
                                    <span><router-link :to="'/voter/' + voter">{{ voter }}</router-link></span>
                                    <span>Voter</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>account_circle</md-icon>
                                <div class="md-list-item-text">
                                    <span>
                                        <router-link
                                            :to="'/candidate/' + candidate">{{ candidate }}</router-link>
                                    </span>
                                    <span>Candidate</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>receipt</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ voted }}</strong> $TOMO</span>
                                    <span>You voted</span>
                                </div>
                            </md-list-item>
                            <md-list-item class="md-layout">
                                <div class="md-layout-item md-xlarge-size-70 md-large-size-70 md-xsmall-size-100">
                                    <md-field :class="getValidationClass('unvoteValue')">
                                        <label>Amount</label>
                                        <md-input
                                            v-model="unvoteValue"
                                            name="vote-value"
                                            min="0.1"
                                            step="0.1"
                                            type="number"/>
                                        <md-icon md-src="/app/assets/tomo.svg" />
                                        <md-tooltip>
                                            The amount of TOMO to unvote</md-tooltip>
                                        <span
                                            v-if="!$v.unvoteValue.required"
                                            class="md-error">Required field</span>
                                        <span
                                            v-else-if="!$v.unvoteValue.minValue"
                                            class="md-error">Must be greater than 10<sup>-18 $TOMO</sup></span>
                                        <span
                                            v-else-if="!$v.unvoteValue.maxValue"
                                            class="md-error">Must be less than {{ voted }} $TOMO</span>
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
                            type="submit"><md-icon>check</md-icon> Submit</md-button>
                    </md-card-actions>
                </md-card>
            </form>
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
import axios from 'axios'
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue,
    maxValue
} from 'vuelidate/lib/validators'
export default {
    name: 'App',
    mixins: [validationMixin],
    data () {
        return {
            isNotReady: !this.web3,
            voter: '',
            candidate: this.$route.params.candidate,
            voted: 0,
            unvoteValue: 1,
            showSnackbar: false,
            snackBarMessage: ''
        }
    },
    validations () {
        return {
            unvoteValue: {
                required,
                minValue: minValue(10 ** -18),
                maxValue: maxValue(this.voted)
            }
        }
    },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        let candidate = self.candidate

        try {
            let account = await self.getAccount()
            self.voter = account

            let voters = await axios.get(`/api/candidates/${candidate}/voters`)
            voters.data.map((v) => {
                if (v.voter === account) {
                    self.voted += (parseFloat(v.capacity) / 10 ** 18)
                }
            })
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {},
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
                this.unvote()
            }
        },
        unvote: async function () {
            let self = this
            let candidate = this.candidate
            let value = this.unvoteValue

            try {
                if (self.isNotReady) {
                    self.$router.push({ path: '/setting' })
                }

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.unvote(candidate, (parseFloat(value) * 10 ** 18), { from: account })
                self.vote -= value

                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully unvoted!'
                    : 'An error occurred while unvoting, please try again'
                setTimeout(() => {
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: `/confirm/${rs.tx}` })
                    }
                }, 2000)
            } catch (e) {
                self.$parent.showProgressBar = false
                self.showSnackbar = true
                self.snackBarMessage = 'An error occurred while unvoting, please try again'
                console.log(e)
            }
        }
    }
}
</script>
