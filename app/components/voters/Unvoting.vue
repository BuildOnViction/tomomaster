<template>
    <div>
        <div class="container">
            <div
                v-if="!voted"
                class="row">
                <div
                    class="tomo-empty col-12">
                    <i class="tm-notice tomo-empty__icon"/>
                    <p class="tomo-empty__description">You have not voted for this candidate, so you can't unvote.</p>
                    <b-button
                        :to="`/voting/${candidate}`"
                        variant="primary">Vote</b-button>
                </div>
            </div>
            <b-row
                v-if="voted"
                align-v="center"
                align-h="center"
                class="m-0">
                <b-card
                    :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                    + (loading ? ' tomo-loading' : '')">
                    <h4 class=" color-white tomo-card__title tomo-card__title--big">Unvote
                        <span class="tomo-card__subtitle">You will receive $TOMO after unvoting</span>
                    </h4>
                    <ul class="tomo-list list-unstyled">
                        <li class="tomo-list__item">
                            <i class="tm-wallet tomo-list__icon" />
                            <p class="tomo-list__text">
                                <span><router-link :to="`/voter/${voter}`">{{ voter }}</router-link></span>
                                <span>Voter</span>
                            </p>
                        </li>
                        <li class="tomo-list__item">
                            <i class="tm-profile tomo-list__icon" />
                            <p class="tomo-list__text">
                                <span><router-link :to="`/candidate/${candidate}`">{{ candidate }}</router-link></span>
                                <span>Candidate</span>
                            </p>
                        </li>
                        <li class="tomo-list__item">
                            <i class="tm-tomo tomo-list__icon" />
                            <p class="tomo-list__text">
                                <span> {{ formatCurrencySymbol(formatNumber(voted)) }}</span>
                                <span>You voted</span>
                            </p>
                        </li>
                    </ul>

                    <b-form
                        class="tomo-form tomo-form--unvote"
                        novalidate
                        @submit.prevent="validate()">
                        <b-form-group
                            label="Amount"
                            label-for="unvote-value"
                            description="The amount of $TOMO to unvote">
                            <b-input-group>
                                <number-input
                                    :class="getValidationClass('unvoteValue')"
                                    :min="0.1"
                                    :step="0.1"
                                    v-model="unvoteValue"
                                    name="vote-value"/>
                                <b-input-group-append>
                                    <i class="tm-tomo" />
                                </b-input-group-append>
                                <span
                                    v-if="$v.unvoteValue.$dirty && !$v.unvoteValue.required"
                                    class="text-danger">Required field</span>
                                <span
                                    v-else-if="$v.unvoteValue.$dirty && !$v.unvoteValue.minValue"
                                    class="text-danger">Must be greater than 10<sup>-18 $TOMO</sup></span>
                                <span
                                    v-else-if="$v.unvoteValue.$dirty && !$v.unvoteValue.maxValue"
                                    class="text-danger">Must be less than {{ voted }} $TOMO</span>
                            </b-input-group>
                        </b-form-group>
                        <div class="buttons text-right">
                            <b-button
                                type="button"
                                variant="secondary"
                                @click="$router.go(-1)">Cancel</b-button>
                            <b-button
                                type="submit"
                                variant="primary">Submit</b-button>
                        </div>
                    </b-form>
                </b-card>
            </b-row>
        </div>
    </div>
</template>
<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue,
    maxValue
} from 'vuelidate/lib/validators'
import NumberInput from '../NumberInput.vue'
export default {
    name: 'App',
    components: {
        NumberInput
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            voter: '',
            candidate: this.$route.params.candidate,
            voted: 0,
            unvoteValue: 1,
            loading: false
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
                    self.voted += new BigNumber(v.capacity).div(10 ** 18).toNumber()
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
                    'is-invalid': field.$error
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
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                }

                self.loading = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.unvote(candidate, (parseFloat(value) * 10 ** 18), {
                    from: account,
                    gasPrice: 1
                })
                self.vote -= value

                let toastMessage = rs.tx ? 'You have successfully unvoted!'
                    : 'An error occurred while unvoting, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    if (rs.tx) {
                        self.$router.push({ path: `/confirm/${rs.tx}` })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
                self.$toasted.show('An error occurred while unvoting, please try again', {
                    type: 'error'
                })
                console.log(e)
            }
        }
    }
}
</script>
