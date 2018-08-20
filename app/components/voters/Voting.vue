<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class=" color-white tomo-card__title tomo-card__title--big">Vote</h4>
                <ul class="tomo-list list-unstyled">
                    <li class="tomo-list__item">
                        <i class="tm-tomo tomo-list__icon" />
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
                </ul>

                <b-form
                    class="tomo-form tomo-form--vote"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        label="Vote"
                        label-for="vote-value"
                        description="How much $TOMO would you like to vote for this candidate?">
                        <b-input-group>
                            <number-input
                                :class="getValidationClass('voteValue')"
                                :min="10"
                                :step="1"
                                v-model="voteValue"
                                name="vote-value"/>
                            <b-input-group-append>
                                <i class="tm-tomo" />
                            </b-input-group-append>
                            <span
                                v-if="$v.voteValue.$dirty && !$v.voteValue.required"
                                class="text-danger">Required field</span>
                            <span
                                v-else-if="$v.voteValue.$dirty && !$v.voteValue.minValue"
                                class="text-danger">Must be greater than 10 $TOMO</span>
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
</template>

<script>
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue
} from 'vuelidate/lib/validators'
import NumberInput from '../NumberInput.vue'
import BigNumber from 'bignumber.js'

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
            voteValue: 10,
            loading: false
        }
    },
    validations: {
        voteValue: {
            required,
            minValue: minValue(10)
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
            if (!self.isReady && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
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
                    'is-invalid': field.$error
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

            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                    throw Error('Web3 is not properly detected.')
                }

                self.loading = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.vote(self.candidate, {
                    from: account,
                    value: new BigNumber(this.voteValue).multipliedBy(10 ** 18).toNumber(),
                    gasPrice: 1
                })

                let toastMessage = rs.tx ? 'You have successfully voted!'
                    : 'An error occurred while voting, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    if (rs.tx) {
                        self.$router.push({ path: `/confirm/${rs.tx}` })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
                self.$toasted.show(`An error occurred while voting. ${String(e)}`, {
                    type : 'error'
                })
                console.log(e)
            }
        }
    }
}
</script>
