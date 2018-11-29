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
                                <span>Coinbase Address</span>
                            </p>
                        </li>
                    </ul>
                    <b-card-footer class="text-right">
                        <p v-if="owner !== account">
                            <i class="tm-notice"/>
                            You are not an owner of this candidate
                        </p>
                        <b-button
                            v-b-modal.resignModal
                            v-if="owner === account"
                            :disabled="loading || owner !== account"
                            variant="secondary"
                            @click="resignActive = true;">Resign</b-button>
                    </b-card-footer>
                </b-card>
            </b-row>
        </div>
        <b-modal
            id="resignModal"
            class="tomo-modal"
            centered
            title="Do you want to resign?"
            ok-title="Yes"
            cancel-title="No"
            @ok="resign()">
            <p>If you resign, you will be able to withdraw all your deposit after around 30 days.</p>
        </b-modal>
    </div>
</template>
<script>
import axios from 'axios'
export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            account: '',
            owner: '',
            resignActive: false,
            loading: false,
            coinbase: this.$route.params.address
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        self.isReady = !!self.web3
        try {
            if (self.isReady) {
                let account = await self.getAccount()
                self.account = (account || '').toLowerCase()
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

                let account = (await self.getAccount() || '').toLowerCase()
                let contract = await self.getTomoValidatorInstance()
                let coinbase = self.coinbase
                let txParams = {
                    from: account,
                    gasPrice: 2500,
                    gas: 2000000
                }
                let rs
                if (self.NetworkProvider === 'ledger') {
                    let nonce = await self.web3.eth.getTransactionCount(account)
                    let dataTx = contract.resign.request(coinbase).params[0]
                    Object.assign(
                        dataTx,
                        dataTx,
                        txParams,
                        {
                            nonce: self.web3.utils.toHex(nonce)
                        }
                    )
                    let signature = await self.signTransaction(dataTx)
                    rs = await self.sendSignedTransaction(dataTx, signature)
                } else {
                    rs = await contract.resign(coinbase, txParams)
                }
                let toastMessage = rs.tx ? 'You have successfully resigned!'
                    : 'An error occurred while retiring, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.loading = false
                    if (rs.tx) {
                        self.$router.push({ path: '/' })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
                self.$toasted.show('An error occurred while retiring, please try again', {
                    type: 'error'
                })
                console.log(e)
            }
        }
    }
}
</script>
