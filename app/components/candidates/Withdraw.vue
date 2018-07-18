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
                    <h2 class="h4 color-white tomo-card__title tomo-card__title--big">Withdraw</h2>

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
                        <b-button
                            v-b-modal.resignModal
                            :disabled="loading"
                            variant="secondary"
                            @click="resignActive = true;">Withdraw</b-button>
                    </b-card-footer>
                </b-card>
            </b-row>
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
export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            withdrawActive: false,
            coinbase: this.$route.params.address,
            loading: false
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {},
    mounted () {
    },
    methods: {
        withdraw: async function () {
            let self = this
            try {
                if (!self.isReady) {
                    self.$router.push({ path: '/setting' })
                }

                self.loading = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let coinbase = this.coinbase

                let rs = await contract.withdraw(coinbase, { from: account })

                let toastMessage = rs.tx ? 'You have successfully withdrawed!'
                    : 'An error occurred while withdrawing, please try again'
                self.$toasted.show(toastMessage)

                setTimeout(() => {
                    self.$parent.isCandidate = rs.tx === 'undefined'
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push({ path: '/' })
                    }
                }, 2000)
            } catch (e) {
                self.loading = false
                self.$toasted.show('An error occurred while withdrawing, please try again', {
                    type: 'error'
                })
                console.log(e)
            }
        }
    }
}
</script>
