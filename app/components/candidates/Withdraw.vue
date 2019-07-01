<template>
    <div>
        <div class="container">
            <div>
                <b-row
                    align-v="center"
                    align-h="center"
                    class="m-0">
                    <b-card
                        :class="'col-12 col-md-8 col-lg-6 tomo-card tomo-card--animated p-0'
                        + (loading ? ' tomo-loading' : '')">
                        <h4 class=" color-white tomo-card__title tomo-card__title--big">Withdrawal Confirmation</h4>

                        <ul class="tomo-list list-unstyled">
                            <li class="tomo-list__item">
                                <i class="tm-wallet tomo-list__icon" />
                                <p class="tomo-list__text">
                                    <span>{{ coinbase }}</span>
                                    <span>Coinbase Address</span>
                                </p>
                            </li>
                            <li class="tomo-list__item">
                                <i class="tm-tomo tomo-list__icon" />
                                <p class="tomo-list__text">
                                    <span> {{ formatCurrencySymbol(formatNumber(capacity)) }}</span>
                                    <span>Capacity</span>
                                </p>
                            </li>
                            <li class="tomo-list__item">
                                <i class="tm-tomo tomo-list__icon" />
                                <p class="tomo-list__text">
                                    <span> {{ blockNumber }}</span>
                                    <span>Block Number</span>
                                </p>
                            </li>
                        </ul>
                        <div
                            style="margin-top: 20px">
                            <div
                                class="wrapper">
                                <div>
                                    <div
                                        class="pull-right"
                                        style="margin-right: -7px; float: right">
                                        <!-- <button
                                            class="btn btn-primary"
                                            variant="primary"
                                            @click="vote">Withdraw</button> -->
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
                        </div>
                        <b-card-footer class="mt-3 text-right">
                            <b-button
                                :disabled="loading"
                                :to="'/setting'"
                                variant="secondary">Back</b-button>
                            <!-- <b-button
                                v-b-modal.resignModal
                                :disabled="loading"
                                variant="secondary"
                                @click="resignActive = true;">Withdraw</b-button> -->
                            <button
                                v-if="provider !== 'tomowallet'"
                                class="btn btn-primary"
                                variant="primary"
                                @click="withdraw(blockNumber, index)">Withdraw</button>
                        </b-card-footer>
                    </b-card>
                </b-row>
            </div>
        </div>
        <b-modal
            id="resignModal"
            class="tomo-modal"
            centered
            title="Do you want to withdraw?"
            ok-title="Yes"
            cancel-title="No"
            @ok="withdraw()">
            <p>If you withdraw, you will receive all your deposit.</p>
        </b-modal>
    </div>
</template>
<script>
import VueQrcode from '@chenfengyuan/vue-qrcode'
import axios from 'axios'
import store from 'store'
import BigNumber from 'bignumber.js'
export default {
    name: 'App',
    components: {
        VueQrcode
    },
    data () {
        return {
            isReady: !!this.web3,
            withdrawActive: false,
            coinbase: this.$route.params.address,
            blockNumber: this.$route.params.blockNumber,
            capacity: this.$route.params.capacity || 0,
            loading: false,
            index: this.$route.params.index,
            interval: null,
            qrCode: 'text',
            processing: true,
            id: '',
            provider: this.Networkprovider || store.get('network') || null,
            gasPrice: null,
            transactionHash: '',
            toastMessage: 'You have successfully withdrawn!',
            toastMessageError: 'An error occurred while withdrawing, please try again'
        }
    },
    computed: { },
    watch: {},
    async updated () {
        if (!this.coinbase) {
            if (this.interval) {
                clearInterval(this.interval)
            }
            self.$router.push({ path: '/' })
        }
    },
    created: function () {
    },
    beforeDestroy () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    destroyed () {
    },
    async mounted () {
        const self = this
        self.config = store.get('config') || await self.appConfig()
        self.chainConfig = self.config.blockchain || {}
        self.isReady = !!this.web3
        if (!self.coinbase) {
            self.$router.push({ path: '/' })
        } else {
            self.gasPrice = await self.web3.eth.getGasPrice()
            let amount = new BigNumber(self.capacity.replace(/,/g, '')).toString(10)
            const data = {
                action: 'withdraw',
                amount,
                voter: self.coinbase,
                candidate: 'no-candidate'
            }
            // call api to generate qr code
            const generatedMess = await axios.post(`/api/voters/generateQR`, data)

            self.id = generatedMess.data.id

            self.qrCode = encodeURI(
                'tomochain:withdraw?amount=' + amount + '&' + 'block=' + self.blockNumber +
                '&index=' + self.index +
                '&submitURL=' + generatedMess.data.url
            )

            if (self.processing && generatedMess.data && self.provider === 'tomowallet') {
                self.interval = setInterval(async () => {
                    await this.verifyScannedQR()
                }, 3000)
            }
        }
    },
    methods: {
        withdraw: async function (blockNumber, index) {
            let self = this
            let contract// = await self.getTomoValidatorInstance()
            contract = self.TomoValidator
            let account = await self.getAccount()
            account = account.toLowerCase()
            self.loading = true
            try {
                console.log('==>', blockNumber, index)
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
                    // let dataTx = contract.withdraw.request(String(blockNumber), String(index)).params[0]
                    console.log(blockNumber)
                    console.log(index)
                    const data = await contract.methods.withdraw(blockNumber, index).encodeABI()
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
                                        self.$router.push({ path: `/setting` })
                                    }
                                }, 2000)
                            }
                        }
                    }
                } else {
                    // wd = await contract.withdraw(String(blockNumber), String(index), txParams)
                    contract.methods.withdraw(blockNumber, index).send(txParams)
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
                                            self.$router.push({ path: `/setting` })
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
                console.log(e)
                self.loading = false
                self.$toasted.show('An error occurred while withdrawing, please try again', {
                    type: 'error'
                })
            }
        },
        onChangeWithdraw (event) {
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
            let { data } = await axios.get('/api/voters/getScanningResult?action=withdraw&id=' + self.id)

            if (!data.error) {
                self.loading = true
                if (data.tx) {
                    clearInterval(self.interval)
                    let toastMessage = (data.tx && data.status) ? 'You have successfully withdrawn!'
                        : 'An error occurred while voting, please try again'
                    self.$toasted.show(toastMessage)
                    setTimeout(() => {
                        if (data.tx) {
                            self.loading = false
                            self.processing = false
                            self.$router.push({ path: `/setting` })
                        }
                    }, 3000)
                }
            }
        }
    }
}
</script>
