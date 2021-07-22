<template>
    <div class="container">
        <b-row
            v-if="step === 1"
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class=" color-white tomo-card__title tomo-card__title--big">Update Masternode Information</h4>
                <b-form
                    class="tomo-form tomo-form--vote"
                    novalidate
                    @submit.prevent="validate()">
                    <b-form-group
                        label="Name"
                        label-for="name-value">
                        <b-form-input
                            v-model="name"
                            name="name-value"/>
                        <span
                            v-if="$v.name.$dirty && !$v.name.required"
                            class="text-danger">Name is required</span>
                        <span
                            v-if="$v.name.$dirty && (!$v.name.minLength || !$v.name.maxLength)"
                            class="text-danger">Name must be 3 - 30 chars long</span>
                    </b-form-group>
                    <b-form-group
                        label="Hardware"
                        label-for="hardware-value">
                        <b-form-input
                            v-model="hardware"
                            name="hardware-value"/>
                        <span
                            v-if="$v.hardware.$dirty && (!$v.hardware.minLength || !$v.hardware.maxLength)"
                            class="text-danger">Hardware must be 3 - 30 chars long</span>
                    </b-form-group>
                    <div class="row">
                        <b-form-group
                            class="col-md-6"
                            label="Data Center Name"
                            label-for="dcName-value">
                            <b-form-input
                                v-model="dcName"
                                name="dcName-value"/>
                            <span
                                v-if="$v.dcName.$dirty && (!$v.dcName.minLength || !$v.dcName.maxLength)"
                                class="text-danger">Data Center Name must be 2 - 30 chars long</span>
                        </b-form-group>
                        <b-form-group
                            class="col-md-6"
                            label="Data Center Location"
                            label-for="dcLocation-value">
                            <b-form-input
                                v-model="dcLocation"
                                name="dcLocation-value"/>
                            <span
                                v-if="$v.dcLocation.$dirty && (!$v.dcLocation.minLength || !$v.dcLocation.maxLength)"
                                class="text-danger">Data Canter Location must be 2 - 30 chars long</span>
                        </b-form-group>
                    </div>
                    <div class="row">
                        <b-form-group
                            class="col-md-6"
                            label="Website"
                            label-for="website-value">
                            <b-form-input
                                v-model="website"
                                name="website-value"
                                placeholder="https://example.com"/>
                            <span
                                v-if="$v.website.$dirty && !$v.website.url"
                                class="text-danger">Not a url</span>

                        </b-form-group>
                        <b-form-group
                            class="col-md-6"
                            label="Telegram"
                            label-for="telegram-value">
                            <b-form-input
                                v-model="telegram"
                                name="telegram-value"
                                placeholder="https://t.me/example"/>
                            <span
                                v-if="$v.telegram.$dirty && !$v.telegram.url"
                                class="text-danger">Not a url</span>

                        </b-form-group>
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
                </b-form>
            </b-card>
        </b-row>
        <b-row
            v-if="step === 2"
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--lighter p-0'
                + (loading ? ' tomo-loading' : '')">
                <h4 class=" color-white tomo-card__title tomo-card__title--big">Confirmation</h4>
                <div>
                    <div
                        class="wrapper">
                        <div
                            id="one">
                            <div>
                                <textarea
                                    :value="candidateNewInfor"
                                    class="sign-message"
                                    type="text"
                                    readonly
                                    cols="100"
                                    rows="6"
                                    style="width: 100%"/>
                            </div>
                        </div>
                        <div
                            style="margin-top: 20px">
                            <div
                                v-if="provider === 'tomowallet'"
                                style="text-align: center">
                                <vue-qrcode
                                    :value="qrCode"
                                    :options="{size: 200 }"
                                    tag="img"
                                    class="img-fluid text-center text-lg-right"/>
                                <div
                                    class="mt-1">
                                    <span
                                        class="text-danger"><b>{{ signHashError }}</b></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        style="margin-top: 10px"
                        class="buttons text-right">
                        <b-button
                            type="button"
                            variant="secondary"
                            @click="backStep">Back</b-button>
                        <button
                            v-if="provider !== 'tomowallet'"
                            class="btn btn-primary"
                            variant="primary"
                            @click="update">Submit</button>
                    </div>
                </div>
            </b-card>
        </b-row>
    </div>
</template>
<script>
// import Web3 from 'web3'
import { validationMixin } from 'vuelidate'
import {
    required,
    minLength,
    maxLength,
    url
} from 'vuelidate/lib/validators'
import axios from 'axios'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import store from 'store'
export default {
    name: 'App',
    components: {
        VueQrcode
    },
    mixins: [validationMixin],
    data () {
        return {
            isReady: !!this.web3,
            address: this.$route.params.address.toLowerCase(),
            name: '',
            hardware: '',
            dcName: '',
            dcLocation: '',
            loading: false,
            step: 1,
            provider: this.NetworkProvider || store.get('network') || null,
            qrCode: 'text',
            message: '',
            signHash: '',
            signHashError: '',
            id: '',
            interval: null,
            account: '',
            website: '',
            telegram: ''
        }
    },
    validations: {
        name: {
            required,
            maxLength: maxLength(30),
            minLength: minLength(3)
        },
        hardware: {
            maxLength: maxLength(30),
            minLength: minLength(3)
        },
        dcName: {
            maxLength: maxLength(30),
            minLength: minLength(2)
        },
        dcLocation: {
            maxLength: maxLength(30),
            minLength: minLength(2)
        },
        website: { url },
        telegram: { url }
    },
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    async created () {
        let self = this
        self.isReady = !!self.web3
        try {
            if (!self.isReady) {
                self.$router.push({ path: '/setting' })
                throw Error('Web3 is not properly detected.')
            }
            self.account = store.get('address') ||
                self.$store.state.address || await self.getAccount()
            const { data } = await axios.get(`/api/candidates/${self.address}`)
            if (data) {
                if (data.owner !== self.account) {
                    self.$toasted.show(`You need log the owner of masternode account in before updating`)
                    setTimeout(() => {
                        self.$router.push({ path: '/setting' })
                    }, 1000)
                } else {
                    self.name = data.name ? data.name : 'Anonymous'
                    self.hardware = data.hardware || 'N/A'
                    self.dcName = (data.dataCenter || {}).name || 'N/A'
                    self.dcLocation = (data.dataCenter || {}).location || 'N/A'
                    self.website = (data.socials || {}).website || ''
                    self.telegram = (data.socials || {}).telegram || ''
                }
            }
        } catch (e) {
            console.log(e)
            self.$toasted.show(e, {
                type : 'error'
            })
        }
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
                // this.update()
            }
        },
        update: async function () {
            let self = this
            try {
                self.loading = true
                switch (self.provider) {
                case 'custom':
                    self.signHash = await self.web3.eth.sign(self.message, self.account)
                    break
                case 'metamask':
                case 'pantograph':
                    self.signHash = await self.web3.eth.personal.sign(self.message, self.account, '')
                    break
                case 'trezor':
                case 'ledger':
                    self.signHash = await self.signMessage(self.message)
                    break
                default:
                    self.loading = false
                    self.$toasted.show(`An error occurred while updating.`, {
                        type: 'error'
                    })
                    break
                }
                // calling update api
                await self.updateCandidateInfo()
            } catch (e) {
                console.log(e)
                self.loading = false
                self.$toasted.show(`An error occurred while updating.`, {
                    type: 'error'
                })
            }
        },
        async nextStep () {
            const self = this
            self.candidateNewInfor = 'Name: ' + self.name +
                '\nHardware: ' + self.hardware +
            '\nData Center Name: ' + self.dcName +
            '\nData Center Location: ' + self.dcLocation +
            '\nWebsite: ' + self.website +
            '\nTelegram: ' + self.telegram
            if (self.provider !== 'custom') {
                const { data } = await axios.post(
                    '/api/candidates/' + self.address + '/generateMessage',
                    {
                        account: self.account
                    }
                )

                self.message = data.message
                self.id = data.id
                self.qrCode = encodeURI(
                    'tomochain:sign?message=' + self.message +
                    '&submitURL=' + data.url
                )
            }
            self.step++
            if (self.step === 2 && self.provider === 'tomowallet') {
                self.interval = setInterval(async () => {
                    await this.verifyScannedQR()
                }, 3000)
            }
        },
        backStep () {
            this.step--
        },
        copyTextArea () {
            this.$refs.text.select()
            document.execCommand('copy')
        },
        async updateCandidateInfo () {
            let self = this
            // calling update api
            try {
                const body = {
                    candidate: self.address,
                    name: self.name,
                    message: self.message,
                    signedMessage: self.signHash
                }
                body.hardware = self.hardware || ''
                if (self.dcName !== '') {
                    body.dcName = self.dcName
                }
                if (self.dcLocation !== '') {
                    body.dcLocation = self.dcLocation
                }

                body.website = self.website
                body.telegram = self.telegram

                const { data } = await axios.put(
                    '/api/candidates/update',
                    body
                )
                if (!data.error) {
                    self.loading = true
                    setTimeout(() => {
                        self.loading = false
                        self.signHashError = ''
                        self.signHash = ''
                        self.$router.push({ path: `/candidate/${self.address}` }, () => {
                            self.$toasted.show('Masternode information updated successfully ')
                        })
                    }, 3000)
                } else {
                    self.loading = false
                    self.signHashError = ''
                    self.signHash = ''
                    if (self.provider === 'tomowallet') {
                        self.signHashError = data.error.message
                        return false
                    } else {
                        self.signHashError = ''
                        self.$toasted.show(data.error.message, {
                            type: 'error'
                        })
                    }
                }
            } catch (e) {
                console.log(e)
                self.loading = false
                self.$toasted.show(`An error occurred while updating.`, {
                    type: 'error'
                })
            }
        },
        async verifyScannedQR () {
            const self = this
            try {
                // 1. Get msg, signature
                const signData = await axios.get(
                    '/api/candidates/' + self.address + '/getSignature?id=' + self.id
                )
                if (!signData.data.error) {
                    clearInterval(self.interval)
                    self.signHash = signData.data.signature
                    // 2. Then call update func
                    await self.updateCandidateInfo()
                }
            } catch (e) {
                console.log(e)
                self.$toasted.show(`An error occurred while updating.`, {
                    type: 'error'
                })
            }
        }
    }
}
</script>
