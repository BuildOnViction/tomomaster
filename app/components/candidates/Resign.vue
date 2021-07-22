<template>
    <div>
        <div class="container">
            <b-row
                align-v="center"
                align-h="center"
                class="m-0">
                <b-card
                    :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--animated p-0'
                    + (loading ? ' tomo-loading' : '')">
                    <h4 class=" color-white tomo-card__title tomo-card__title--big">Resign</h4>
                    <ul class="tomo-list list-unstyled">
                        <li class="tomo-list__item">
                            <i class="tm-wallet tomo-list__icon" />
                            <p class="tomo-list__text">
                                <span>{{ coinbase }}</span>
                                <span>SDX Masternode Address</span>
                            </p>
                        </li>
                    </ul>
                    <b-card-footer class="text-right">
                        <p v-if="owner !== account">
                            <i class="tm-notice"/>
                            You are not an owner of this Masternode.
                        </p>
                        <!-- <b-button
                            v-b-modal.confirmResignModal
                            v-if="owner === account"
                            :disabled="loading || owner !== account"
                            variant="secondary"
                            @click="resignActive = true;">Resign</b-button> -->
                        <b-button
                            v-b-modal.confirmResignModal
                            v-if="owner === account"
                            :disabled="loading || owner !== account"
                            variant="secondary"
                            @click="resignActive = true;">Resign</b-button>
                    </b-card-footer>
                </b-card>
            </b-row>
        </div>
        <b-modal
            id="confirmResignModal"
            class="tomo-modal"
            centered
            title="Do you want to resign?"
            ok-title="Yes"
            cancel-title="No"
            @ok="resignValidation()">
            <p>If you resign, you will be able to withdraw all your deposit after around 30 days.</p>
        </b-modal>
        <b-modal
            ref="resignModal"
            class="tomo-modal"
            centered
            title="Scan this QR code by TomoWallet"
            hide-footer>
            <div
                v-if="provider === 'tomowallet'"
                style="text-align: center">
                <vue-qrcode
                    :value="qrCode"
                    :options="{size: 200 }"
                    class="img-fluid text-center text-lg-right"/>
            </div>
            <b-btn
                class="mt-3"
                variant="outline-danger"
                block
                @click="hideModal">Close</b-btn>
        </b-modal>
    </div>
</template>
<script>
import axios from 'axios'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import store from 'store'
export default {
    name: 'App',
    components: {
        VueQrcode
    },
    data () {
        return {
            isReady: !!this.web3,
            account: '',
            owner: '',
            resignActive: false,
            loading: false,
            coinbase: this.$route.params.address,
            provider: this.NetworkProvider || store.get('network') || null,
            qrCode: 'text',
            interval: null,
            gasPrice: null,
            transactionHash: '',
            toastMessage: 'You have successfully resigned!',
            toastMessageError: 'An error occurred while retiring, please try again'
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        self.config = store.get('configMaster') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.isReady = !!self.web3
        self.gasPrice = await self.web3.eth.getGasPrice()
        try {
            if (self.isReady) {
                self.account = store.get('address') ||
                    self.$store.state.address || await self.getAccount()
            }

            let candidate = await axios.get(`/api/candidates/${self.coinbase}`)
            self.owner = (candidate.data.owner || '').toLowerCase()
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        resign: async function () {
            let self = this
            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                }

                self.loading = true

                const account = (await self.getAccount() || '').toLowerCase()
                let contract// = await self.getTomoValidatorInstance()
                contract = self.TomoValidator
                let coinbase = self.coinbase
                let txParams = {
                    from: account,
                    gasPrice: self.web3.utils.toHex(self.gasPrice),
                    gas: self.web3.utils.toHex(self.chainConfig.gas),
                    gasLimit: self.web3.utils.toHex(self.chainConfig.gas),
                    chainId: self.chainConfig.networkId
                }
                if (self.NetworkProvider === 'ledger' ||
                    self.NetworkProvider === 'trezor') {
                    let nonce = await self.web3.eth.getTransactionCount(account)
                    // let dataTx = contract.resign.request(coinbase).params[0]
                    let data = await contract.methods.resign(coinbase).encodeABI()

                    const dataTx = {
                        data,
                        to: self.chainConfig.validatorAddress
                    }

                    if (self.NetworkProvider === 'trezor') {
                        txParams.value = self.web3.utils.toHex(0)
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
                                        self.$router.push({ path: '/' })
                                    }
                                }, 2000)
                            }
                        }
                    }
                } else {
                    // rs = await contract.resign(coinbase, txParams)
                    contract.methods.resign(coinbase).send(txParams)
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
                                            self.$router.push({ path: '/' })
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
                self.$toasted.show('An error occurred while retiring, please try again', {
                    type: 'error'
                })
                console.log(e)
            }
        },
        hideModal () {
            this.$refs.resignModal.hide()
        },
        async resignValidation () {
            const self = this
            try {
                if (self.provider === 'tomowallet') {
                    if (self.interval) {
                        clearInterval(self.interval)
                    }
                    const data = {
                        voter: self.account,
                        candidate: self.coinbase,
                        amount: self.voteValue || 0,
                        action: 'resign'
                    }
                    // call api to generate qr code
                    const generatedMess = await axios.post(`/api/voters/generateQR`, data)

                    self.id = generatedMess.data.id

                    self.qrCode = encodeURI(
                        'tomochain:resign?candidate=' + self.coinbase +
                        '&submitURL=' + generatedMess.data.url
                    )
                    self.$refs.resignModal.show()
                    // set interval
                    self.interval = setInterval(async () => {
                        self.verifyScannedQR()
                    }, 3000)
                } else {
                    await self.resign()
                }
            } catch (error) {
                console.log(error)
                self.$toasted.show('An error occurred while retiring, please try again', {
                    type: 'error'
                })
            }
        },
        async verifyScannedQR () {
            let self = this
            let { data } = await axios.get('/api/voters/getScanningResult?action=resign&id=' + self.id)

            if (!data.error) {
                self.hideModal()
                self.loading = true
                if (data.tx) {
                    clearInterval(self.interval)
                    let toastMessage = (data.tx && data.status) ? 'You have successfully resigned!'
                        : 'An error occurred while voting, please try again'
                    self.$toasted.show(toastMessage)
                    setTimeout(() => {
                        self.loading = false
                        if (data.tx) {
                            self.$router.push({ path: '/' })
                        }
                    }, 2000)
                }
            }
        }
    }
}
</script>
