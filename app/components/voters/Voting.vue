<template>
    <div>
        <div class="table-container md-layout md-gutter md-alignment-center">
            <form
                novalidate
                class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100"
                @submit.prevent="validate()">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Voting</p>
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
                            <md-list-item class="md-layout">
                                <div class="md-layout-item md-xlarge-size-70 md-large-size-70 md-xsmall-size-100">
                                    <md-field :class="getValidationClass('voteValue')">
                                        <label>Vote</label>
                                        <md-input
                                            v-model="voteValue"
                                            name="vote-value"
                                            min="0.1"
                                            step="0.1"
                                            type="number"/>
                                        <md-icon md-src="/app/assets/tomo.svg" />
                                        <md-tooltip>
                                            How much $TOMO would you like to vote for this candidate?</md-tooltip>
                                        <span
                                            v-if="!$v.voteValue.required"
                                            class="md-error">Required field</span>
                                        <span
                                            v-else-if="!$v.voteValue.minValue"
                                            class="md-error">Must be greater than 10<sup>-18 $TOMO</sup></span>
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
        <div class="md-layout md-gutter md-alignment-center">
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
            isNotReady: !this.web3,
            voter: '',
            candidate: this.$route.params.candidate,
            voteValue: 1,
            showSnackbar: false,
            snackBarMessage: ''
        }
    },
    validations: {
        voteValue: {
            required,
            minValue: minValue(10 ** -18)
        }
    },
    computed: {
    },
    watch: {
    },
    updated () {},
    created: async function () {
        let self = this
        try {
            let account = await self.getAccount()
            self.voter = account
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
                this.vote()
            }
        },
        vote: async function () {
            let self = this
            let value = this.voteValue

            try {
                if (self.isNotReady) {
                    self.$router.push('/setting')
                }

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.vote(self.candidate, {
                    from: account,
                    value: parseFloat(value) * 10 ** 18
                })

                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully voted!'
                    : 'An error occurred while voting, please try again'
                setTimeout(() => {
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push(`/confirm/${rs.tx}`)
                    }
                }, 2000)
            } catch (e) {
                self.$parent.showProgressBar = false
                self.showSnackbar = true
                self.snackBarMessage = 'An error occurred while voting, please try again'
                console.log(e)
            }
        }
    }
}
</script>
