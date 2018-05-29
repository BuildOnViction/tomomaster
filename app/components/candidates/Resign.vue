<template>
    <div>
        <div
            class="container md-layout md-gutter md-alignment-top-center">
            <div
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>
                    <md-card-header>
                        <div class="md-title">Resign
                            <p class="md-subhead">You are not a backer of this candidate</p>
                        </div>
                    </md-card-header>

                    <md-card-content>
                        <md-list
                            class="md-double-line">
                            <md-list-item
                                class="md-layout">
                                <md-icon>account_balance_wallet</md-icon>
                                <div class="md-list-item-text">
                                    <span>{{ coinbase }}</span>
                                    <span>Coinbase Address</span>
                                </div>
                            </md-list-item>
                        </md-list>
                    </md-card-content>

                    <md-card-actions>
                        <md-button
                            :disabled="this.$parent.showProgressBar || backer !== account"
                            class="md-accent md-raised"
                            @click="resignActive = true;">
                            <md-icon>{{ backer === account ? 'arrow_downward' : 'error_outline' }}</md-icon>
                            &nbsp;Resign</md-button>
                    </md-card-actions>
                </md-card>
            </div>
        </div>
        <md-dialog-confirm
            :md-active.sync="resignActive"
            md-title="Do you want to resign?"
            md-content="If you resign, you will be able to withdraw all your deposit after 100 * 2 seconds."
            md-confirm-text="Yes"
            md-cancel-text="No"
            @md-confirm="resign()"/>
        <md-snackbar
            :md-active.sync="showSnackbar"
            md-position="left"
            md-persistent>
            <span>{{ snackBarMessage }}</span>
            <md-button
                class="md-primary"
                @click="showSnackbar = false">OK</md-button>
        </md-snackbar>
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
            backer: '',
            resignActive: false,
            showSnackbar: false,
            snackBarMessage: '',
            candidateCap: 10000,
            coinbase: this.$route.params.address
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            if (self.isReady) {
                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let cap = await contract.getCandidateCap(account)

                self.account = account
                self.candidateCap = String(cap / 10 ** 18)
            }

            let candidate = await axios.get(`/api/candidates/${self.coinbase}`)
            self.backer = candidate.data.backer
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

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let coinbase = self.coinbase
                let rs = await contract.resign(coinbase, { from: account })

                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully resigned!'
                    : 'An error occurred while retiring, please try again'
                setTimeout(() => {
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: '/' })
                    }
                }, 2000)
            } catch (e) {
                self.$parent.showProgressBar = false
                self.showSnackbar = true
                self.snackBarMessage = 'An error occurred while retiring, please try again'
                console.log(e)
            }
        }
    }
}
</script>
