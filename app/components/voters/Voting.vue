<template>
    <div class="container">
        <div
            v-if="step === 1">
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
                            description="How much TOMO would you like to vote for this candidate?
                            TX fee: 0.0000000000525 TOMO">
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
                                    class="text-danger">Must be greater than 10 TOMO</span>
                            </b-input-group>
                        </b-form-group>
                        <div class="buttons text-right">
                            <b-button
                                type="button"
                                variant="secondary"
                                @click="$router.go(-1)">Cancel</b-button>
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
                    <h4 class=" color-white tomo-card__title tomo-card__title--big">Vote</h4>
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
                                    <b>Voting information</b>
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
                            <label>
                                <input
                                    v-model="checked"
                                    type="checkbox"
                                    @change="onChangeVoting">
                                <b>Vote by TomoWallet</b>
                            </label>
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
                                    v-if="checked"
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
                                v-if="!checked"
                                class="btn btn-primary"
                                variant="primary"
                                @click="vote">Submit</button>
                            <b-button
                                v-if="checked"
                                @click="createRawTx">Create</b-button>
                        </div>
                    </div>
                </b-card>
            </b-row>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import { validationMixin } from 'vuelidate'
import {
    required,
    minValue
} from 'vuelidate/lib/validators'
import NumberInput from '../NumberInput.vue'
import BigNumber from 'bignumber.js'
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
            voter: 'Unknown',
            candidate: this.$route.params.candidate,
            voteValue: 10,
            loading: false,
            step: 1,
            message: '',
            qrCode: '',
            checked:   true,
            processing: true,
            id: '',
            interval: null
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
            if (account) {
                self.voter = account
            }
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
    async mounted () {
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
                this.nextStep()
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
                    gasPrice: 2500,
                    gas: 1000000
                })

                let toastMessage = rs.tx ? 'You have successfully voted!'
                    : 'An error occurred while voting, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    self.processing = false
                    if (self.interval) {
                        clearInterval(self.interval)
                    }
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
        },
        onSuccess () {
            this.$toasted.show('Copied')
        },
        async nextStep () {
            const self = this
            const data = {
                voter: self.voter,
                candidate: self.candidate,
                amount: self.voteValue
            }
            // call api to generate qr code
            const generatedMess = await axios.post(`/api/voters/generateQR`, data)

            self.message = generatedMess.data.message
            self.id = generatedMess.data.id

            self.qrCode = encodeURI(
                'tomochain:vote?amount=' + self.voteValue + '&' + 'candidate=' + self.candidate +
                '&name=' + generatedMess.data.candidateName +
                '&submitURL=' + generatedMess.data.url + generatedMess.data.id
            )
            self.step++

            if (self.step === 2 && self.processing) {
                self.interval = setInterval(async () => {
                    await this.verifyScannedQR()
                }, 3000)
            }
        },
        backStep () {
            this.step--
        },
        async createRawTx () {
            const rawTx = await axios.post(
                '/api/voters/createRawTx',
                {
                    voteValue: this.voteValue,
                    candidate: this.candidate
                }
            )
        },
        async verifyScannedQR () {
            let self = this
            let body = {}
            if (self.id) {
                body.id = self.id
            }
            body.voter = self.voter
            let { data } = await axios.post('/api/voters/getVotingResult', body)

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
        },
        onChangeVoting (event) {
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
        }
    }
}
</script>
