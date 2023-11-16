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
                            <i class="tm-tomo2 tomo-list__icon" />
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
                            <i class="tm-tomo2 tomo-list__icon" />
                            <p class="tomo-list__text">
                                <span> {{ formatCurrencySymbol(formatNumber(balance)) }}</span>
                                <span>Balance</span>
                            </p>
                        </li>
                    </ul>

                    <b-form
                        class="tomo-form tomo-form--vote"
                        novalidate
                        @submit.prevent="validate()">
                        <b-form-group
                            :description="`How much VIC would you like to vote for this candidate?
                            TX fee: ${txFee} VIC`"
                            label="Vote"
                            label-for="vote-value">
                            <b-input-group>
                                <number-input
                                    :class="getValidationClass('voteValue')"
                                    :min="10"
                                    :step="10"
                                    v-model="voteValue"
                                    name="vote-value"/>
                                <!-- <b-input-group-append>
                                    <i class="tm-tomo2" />
                                </b-input-group-append> -->
                                <span
                                    v-if="$v.voteValue.$dirty && !$v.voteValue.required"
                                    class="text-danger">Required field</span>
                                <span
                                    v-else-if="$v.voteValue.$dirty && !$v.voteValue.minValue"
                                    class="text-danger">Minimum of voting is 100 VIC</span>
                                <span
                                    v-else-if="votingError"
                                    class="text-danger">Not enough VIC</span>
                            </b-input-group>
                        </b-form-group>
                        <div>
                            <div
                                class="row float-left col-12 mb-2">
                                <estimate-reward
                                    :value="voteValue"
                                    :candidate="candidate"
                                    class="estimate-reward"/>
                            </div>
                            <div class="buttons text-right">
                                <b-button
                                    type="button"
                                    variant="secondary"
                                    @click="$router.go(-1)">Cancel</b-button>
                                <b-button
                                    type="submit"
                                    variant="primary">Next</b-button>
                            </div>
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
                                    v-if="provider === 'tomowallet'"
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
                                v-if="provider !== 'tomowallet'"
                                class="btn btn-primary"
                                variant="primary"
                                @click="vote">Submit</button>
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
import store from 'store'
import EstimateReward from './EstimateReward.vue'

export default {
    name: 'App',
    components: {
        NumberInput,
        VueQrcode,
        EstimateReward
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            voter: 'Unknown',
            candidate: this.$route.params.candidate,
            voteValue: '100',
            loading: false,
            step: 1,
            message: '',
            qrCode: '',
            processing: true,
            id: '',
            interval: null,
            balance: 0,
            provider: this.NetworkProvider || store.get('network') || null,
            votingError: false,
            txFee: 0,
            gasPrice: null,
            transactionHash: '',
            toastMessageError: 'An error occurred while voting, please try again',
            toastMessage: 'You have successfully voted!'
        }
    },
    validations: {
        voteValue: {
            required,
            minValue: minValue(100)
        }
    },
    computed: {
        estimatedReward: function () {
            return this.voteValue
        }
    },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        self.config = store.get('configMaster') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.isReady = !!self.web3
        self.gasPrice = await self.web3.eth.getGasPrice()
        self.txFee = new BigNumber(this.chainConfig.gas * self.gasPrice).div(10 ** 18).toString(10)
        try {
            if (!self.isReady && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            self.voter = store.get('address') ||
                self.$store.state.address || await self.getAccount()
            self.web3.eth.getBalance(self.voter, function (a, b) {
                self.balance = new BigNumber(b).div(10 ** 18)
                if (a) {
                    console.log('got an error', a)
                }
            })
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
    destroyed () {
        if (this.interval) {
            clearInterval(this.interval)
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
            this.voteValue = this.voteValue.replace(/,/g, '')
            this.$v.$touch()

            if (!this.$v.$invalid) {
                if ((new BigNumber(this.voteValue)).isGreaterThanOrEqualTo(this.balance)) {
                    this.votingError = true
                } else {
                    this.votingError = false
                    this.nextStep()
                }
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
                const account = (await self.getAccount() || '').toLowerCase()
                let contract// = await self.getTomoValidatorInstance()
                contract = self.TomoValidator
                let txParams = {
                    from: account,
                    value: self.web3.utils.toHex(new BigNumber(this.voteValue).multipliedBy(10 ** 18).toString(10)),
                    gasPrice: self.web3.utils.toHex(self.gasPrice),
                    gas: self.web3.utils.toHex(self.chainConfig.gas),
                    gasLimit: self.web3.utils.toHex(self.chainConfig.gas),
                    chainId: self.chainConfig.networkId
                }
                if (self.NetworkProvider === 'ledger' ||
                    self.NetworkProvider === 'trezor') {
                    // check if network provider is hardware wallet
                    // sign transaction using hardwarewallet before sending to chain

                    // https://bit.ly/2KEXzQe
                    // signing and sending processes
                    //
                    //
                    // login device
                    // sign transaction with function and parameter to get signature
                    // attach txParams and signature then sendSignedTransaction
                    let nonce = await self.web3.eth.getTransactionCount(account)
                    // let dataTx = contract.vote.request(self.candidate).params[0]
                    let data = await contract.methods.vote(self.candidate).encodeABI()
                    const dataTx = {
                        data,
                        to: self.chainConfig.validatorAddress
                    }
                    Object.assign(
                        dataTx,
                        dataTx,
                        txParams,
                        {
                            nonce: self.web3.utils.toHex(nonce)
                        }
                    )
                    let signature = await self.signTransaction(dataTx)
                    const txHash = await self.sendSignedTransaction(dataTx, signature)
                    if (txHash) {
                        self.transactionHash = txHash
                        let check = true
                        while (check) {
                            const receipt = await self.web3.eth.getTransactionReceipt(txHash)
                            if (receipt) {
                                check = false
                                self.$toasted.show(self.toastMessage)
                                setTimeout(() => {
                                    self.loading = false
                                    if (self.transactionHash) {
                                        self.$router.push({ path: `/confirm/${self.transactionHash}` })
                                    }
                                }, 2000)
                            }
                        }
                    }
                } else {
                    // rs = await contract.vote(self.candidate, txParams)
                    contract.methods.vote(self.candidate).send(txParams)
                        .on('transactionHash', async (txHash) => {
                            self.transactionHash = txHash
                            let check = true
                            while (check) {
                                const receipt = await self.web3.eth.getTransactionReceipt(txHash)
                                if (receipt) {
                                    check = false
                                    self.$toasted.show(self.toastMessage)
                                    setTimeout(() => {
                                        self.loading = false
                                        if (self.transactionHash) {
                                            self.$router.push({ path: `/confirm/${self.transactionHash}` })
                                        }
                                    }, 2000)
                                }
                            }
                        }).catch(e => {
                            console.log(e)
                            self.loading = false
                            self.$toasted.show(self.toastMessageError + e, { type: 'error' })
                        })
                }
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
            const amount = new BigNumber(self.voteValue).toString(10)
            const data = {
                voter: self.voter,
                candidate: self.candidate,
                amount,
                action: 'vote'
            }
            // call api to generate qr code
            const generatedMess = await axios.post(`/api/voters/generateQR`, data)

            self.message = generatedMess.data.message
            self.id = generatedMess.data.id

            self.qrCode = encodeURI(
                'tomochain:vote?amount=' + amount + '&' + 'candidate=' + self.candidate +
                '&name=' + generatedMess.data.candidateName +
                '&submitURL=' + generatedMess.data.url
            )
            self.step++

            if (self.step === 2 && self.processing && self.provider === 'tomowallet') {
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
        async verifyScannedQR () {
            let self = this
            let { data } = await axios.get('/api/voters/getScanningResult?action=vote&id=' + self.id)

            if (!data.error) {
                self.loading = true
                if (data.tx) {
                    clearInterval(self.interval)
                    let toastMessage = (data.tx && data.status) ? 'You have successfully voted!'
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
