<template>
    <div class="container">
        <b-row
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
                            variant="primary">Submit</b-button>
                    </div>
                </b-form>
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
// import store from 'store'
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
            loading: false
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
                this.update()
            }
        },
        update: async function () {
            let self = this
            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                    throw Error('Web3 is not properly detected.')
                }

                self.loading = true
                // calling update api
                const { data } = await axios.put(
                    '/api/candidates/update',
                    {
                        candidate: self.address,
                        name: self.name,
                        hardware: self.hardware,
                        dcName: self.dcName,
                        dcLocation: self.dcLocation,
                        message: 'aaa',
                        signedMessage: '0xda22579bb441c6aac42091387591e020ddf77f68307171544d087f3dbe6fe83a1e0fd5' +
                            '0fbd1088c3ac1b6a84fa3f62f383b60fbca01e39531496c0e302320ac11b'
                    }
                )
                if (data) {
                    setTimeout(() => {
                        self.$toasted.show('Candidate\'s information updated successfully ')
                        self.loading = false
                        self.$router.push({ path: `/candidate/${self.address}` })
                    }, 3000)
                }
            } catch (error) {
                console.log(error)
            }
        }
    }
}
</script>
