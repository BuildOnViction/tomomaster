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
                <h4 class=" color-white tomo-card__title tomo-card__title--big">Update Candidate Information</h4>
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
                    <b-form-group
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
                        label="Data Center Location"
                        label-for="dcLocation-value">
                        <b-form-input
                            v-model="dcLocation"
                            name="dcLocation-value"/>
                        <span
                            v-if="$v.dcLocation.$dirty && (!$v.dcLocation.minLength || !$v.dcLocation.maxLength)"
                            class="text-danger">Data Canter Location must be 2 - 30 chars long</span>
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
                                <label><b>Name:</b></label>
                                <input
                                    v-model="name"
                                    class="form-control"
                                    readonly >
                            </div>
                            <div style="margin-top: 5px">
                                <label><b>Hardware:</b></label>
                                <input
                                    v-model="hardware"
                                    class="form-control"
                                    readonly >
                            </div>
                            <div style="margin-top: 5px">
                                <label><b>Data Center Name:</b></label>
                                <input
                                    v-model="dcName"
                                    class="form-control"
                                    readonly >
                            </div>
                            <div style="margin-top: 5px">
                                <label><b>Data Center Location:</b></label>
                                <input
                                    v-model="dcLocation"
                                    class="form-control"
                                    readonly>
                            </div>
                        </div>
                        <div
                            style="margin-top: 20px">
                            <div
                                v-if="provider === 'tomowallet'"
                                style="text-align: center">
                                <vue-qrcode
                                    :value="qrCode"
                                    :options="{size: 250 }"
                                    class="img-fluid text-center text-lg-right"/>
                            </div>
                            <div
                                v-if="provider === 'metamask'">
                                <strong>Copy message below and sign the message using
                                    <a
                                        href="https://www.mycrypto.com/signmsg.html"
                                        style="color: #3498db">MyCrypto</a>
                                    or <a
                                        href="https://www.myetherwallet.com/signmsg.html"
                                        style="color: #3498db">MyEtherWallet</a>
                                </strong>
                                <label style="margin-top: 5px">
                                    <div>
                                        <textarea
                                            ref="text"
                                            :value="message"
                                            class="sign-message"
                                            type="text"
                                            readonly
                                            cols="100"
                                            rows="2"
                                            style="width: 100%"
                                            @click="copyTextArea"/>
                                    </div>
                                </label>
                                <div>
                                    <input
                                        v-model="signHash"
                                        class="form-control"
                                        type="text"
                                        style="box-sizing: border-box; width: 100%"
                                        placeholder="Enter the message signature hash">
                                    <span
                                        class="text-danger">{{ signHashError }}</span>
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
    minLength,
    maxLength
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
            signHashError: ''
        }
    },
    validations: {
        name: {
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
        }
    },
    async created () {
        let self = this
        if (!self.isReady) {
            self.$router.push({ path: '/setting' })
            throw Error('Web3 is not properly detected.')
        }
        const { data } = await axios.get(`/api/candidates/${self.address}`)
        if (data) {
            self.name = data.name ? data.name : 'Anonymous Candidate'
            self.hardware = data.hardware
            self.dcName = (data.dataCenter || {}).name || 'N/A'
            self.dcLocation = (data.dataCenter || {}).location || 'N/A'
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
            const account = (await self.getAccount() || '').toLowerCase()
            try {
                if (self.provider === 'metamask' && self.signHash === '') {
                    self.signHashError = 'This field is required'
                    return false
                }
                self.loading = true
                if (self.provider === 'custom') {
                    self.signHash = await self.web3.eth.sign(self.message, account)
                }
                // calling update api
                const { data } = await axios.put(
                    '/api/candidates/update',
                    {
                        candidate: self.address,
                        name: self.name,
                        hardware: self.hardware,
                        dcName: self.dcName,
                        dcLocation: self.dcLocation,
                        message: self.message,
                        signedMessage: self.signHash
                    }
                )
                if (!data.error) {
                    setTimeout(() => {
                        self.$toasted.show('Candidate\'s information updated successfully ')
                        self.loading = false
                        self.signHashError = ''
                        self.$router.push({ path: `/candidate/${self.address}` })
                    }, 3000)
                } else {
                    self.loading = false
                    self.$toasted.show(data.error.message, {
                        type: 'error'
                    })
                }
            } catch (e) {
                console.log(e)
                self.loading = false
                self.$toasted.show(`An error occurred while voting. ${String(e)}`, {
                    type: 'error'
                })
            }
        },
        async nextStep () {
            const self = this
            if (self.provider !== 'custom') {
                const { data } = await axios.get('/api/candidates/' + self.address + '/generateMessage')

                self.message = data.message
            }
            self.step++
        },
        backStep () {
            this.step--
        },
        copyTextArea () {
            this.$refs.text.select()
            document.execCommand('copy')
        }
    }
}
</script>
