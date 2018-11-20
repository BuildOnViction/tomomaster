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
            <div
                v-if="voted">
                <div
                    v-if="step === 1">
                    <b-row
                        v-if="voted"
                        align-v="center"
                        align-h="center"
                        class="m-0">
                        <b-card
                            :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                            + (loading ? ' tomo-loading' : '')">
                            <h4 class=" color-white tomo-card__title tomo-card__title--big">Unvote
                                <span
                                    class="tomo-card__subtitle">
                                    Your TOMO will be locked in a duration after unvoting</span>
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
                                        <span>
                                            <router-link :to="`/candidate/${candidate}`">
                                                {{ candidate }}
                                            </router-link>
                                        </span>
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
                                    description="The amount of TOMO to unvote. TX fee: 0.0000000000525 TOMO">
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
                                            class="text-danger">Must be greater than 10<sup>-18 TOMO</sup></span>
                                        <span
                                            v-else-if="$v.unvoteValue.$dirty && !$v.unvoteValue.maxValue"
                                            class="text-danger">Must be less than {{ voted }} TOMO</span>
                                    </b-input-group>
                                </b-form-group>
                                <div class="buttons text-right">
                                    <b-button
                                        type="button"
                                        variant="secondary"
                                        @click="$router.go(-1)">Cancel</b-button>
                                    <!-- <b-button
                                        type="submit"
                                        variant="primary">Submit</b-button> -->
                                    <b-button
                                        type="submit"
                                        variant="primary">Next</b-button>
                                </div>
                            </b-form>
                        </b-card>
                    </b-row>
                </div>
                <div
                    v-if="step === 2">
                    <b-row
                        align-v="center"
                        align-h="center">
                        <b-card
                            :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                            + (loading ? ' tomo-loading' : '')">
                            <h4 class=" color-white tomo-card__title tomo-card__title--big">Confirmation</h4>
                            <!-- <div>
                                <strong>Using Tomo wallet to execute the action
                                </strong>
                            </div> -->
                            <div
                                style="margin-top: 20px">
                                <div
                                    class="wrapper">
                                    <div
                                        id="one">
                                        <label>
                                            <b>Unvoting information</b>
                                        </label>
                                        <label style="margin-top: 5px">
                                            <textarea
                                                :value="message"
                                                class="sign-message"
                                                type="text"
                                                disabled
                                                cols="100"
                                                rows="4"
                                                style="width: 100%"/>
                                        </label>
                                    </div>
                                    <div>
                                        <div
                                            class="pull-right"
                                            style="margin-right: -7px; float: right">
                                            <!-- <button
                                                class="btn btn-primary"
                                                variant="primary"
                                                @click="vote">Submit</button> -->
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            v-if="$store.state.walletLoggedIn"
                                            style="text-align: center; margin-top: 10px">
                                            <vue-qrcode
                                                :value="qrCode"
                                                :options="{size: 250 }"
                                                class="img-fluid text-center text-lg-right"/>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style="margin-top: 5px"
                                    class="buttons text-right">
                                    <b-button
                                        type="button"
                                        variant="secondary"
                                        @click="backStep">Back</b-button>
                                    <button
                                        v-if="!$store.state.walletLoggedIn"
                                        class="btn btn-primary"
                                        variant="primary"
                                        @click="unvote">Submit</button>
                                </div>
                            </div>
                        </b-card>
                    </b-row>
                </div>
            </div>
        </div>
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
import NumberInput from '../NumberInput.vue'
import VueQrcode from '@chenfengyuan/vue-qrcode'
export default {
    name: 'App',
    components: {
        NumberInput,
        VueQrcode
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            voter: '',
            candidate: this.$route.params.candidate,
            voted: 0,
            unvoteValue: 1,
            loading: false,
            step: 1,
            interval: null,
            processing: true
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
    destroyed () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        let self = this
        let candidate = self.candidate

        try {
            const account = this.$store.state.walletLoggedIn
                ? this.$store.state.walletLoggedIn : await self.getAccount()
            self.voter = account

            let contract = await self.TomoValidator.deployed()
            let votedCap = await contract.getVoterCap(candidate, account)
            self.voted = votedCap.div(10 ** 18).toNumber()
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
                this.nextStep()
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
                    gasPrice: 2500,
                    gas: 1000000
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
        },
        async nextStep () {
            const self = this
            const data = {
                action: 'unvote',
                voter: self.voter,
                candidate: self.candidate,
                amount: self.unvoteValue
            }
            // call api to generate qr code
            const generatedMess = await axios.post(`/api/voters/generateQR`, data)

            self.message = generatedMess.data.message
            self.id = generatedMess.data.id

            self.qrCode = encodeURI(
                'tomochain:unvote?amount=' + self.unvoteValue + '&' + 'candidate=' + self.candidate +
                '&name=' + generatedMess.data.candidateName +
                '&submitURL=' + generatedMess.data.url + generatedMess.data.id
            )
            this.step++
            if (self.step === 2 && self.processing) {
                self.interval = setInterval(async () => {
                    await this.verifyScannedQR()
                }, 3000)
            }
        },
        backStep () {
            if (this.interval) {
                clearInterval(this.interval)
            }
            this.step--
        },
        onChangeUnvoting (event) {
            const checking = event.target.checked
            if (checking) {
                this.interval = setInterval(async () => {
                    await this.verifyScannedQR()
                }, 3000)
            } else {
                if (this.interval) {
                    clearInterval(this.interval)
                }
            }
        },
        async verifyScannedQR () {
            let self = this
            let body = {}
            if (self.id) {
                body.id = self.id
            }
            body.voter = self.voter
            let { data } = await axios.post('/api/voters/getScanningResult', body)

            if (!data.error) {
                self.loading = true
                if (self.interval) {
                    clearInterval(self.interval)
                }

                let toastMessage = data.tx ? 'You have successfully voted!'
                    : 'An error occurred while voting, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    if (data.tx) {
                        self.loading = false
                        self.processing = false
                        self.step = 0
                        self.$router.push({ path: `/confirm/${data.tx}` })
                    }
                }, 2000)
            }
        }
    }
}
</script>
