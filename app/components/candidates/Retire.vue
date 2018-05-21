<template>
    <div>
        <md-empty-state
            v-if="!this.$parent.isCandidate && !this.$parent.showProgressBar"
            md-icon="account_circle"
            md-label="Opps!!"
            md-description="You are not a candidate, so you cannot retire">
            <md-button
                class="md-primary md-raised"
                to="/apply">Become a candidate</md-button>
        </md-empty-state>
        <div
            v-if="this.$parent.isCandidate"
            class="table-container md-layout md-gutter md-alignment-top-center">
            <div class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Retire</p>
                    </md-card-header>

                    <md-card-content>
                        You deposited <b>{{ candidateCap }} $TOMO</b>. We will return this deposit to you.
                    </md-card-content>

                    <md-card-actions>
                        <md-button
                            :disabled="this.$parent.showProgressBar"
                            class="md-accent md-raised"
                            @click="retireActive = true;"><md-icon>arrow_downward</md-icon> Retire</md-button>
                    </md-card-actions>
                </md-card>
            </div>
        </div>
        <md-dialog-confirm
            :md-active.sync="retireActive"
            md-title="Do you want to retire?"
            md-content="If you retire, you will receive back all your deposit."
            md-confirm-text="Yes"
            md-cancel-text="No"
            @md-confirm="retire()"/>
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
export default {
    name: 'App',
    data () {
        return {
            retireActive: false,
            showSnackbar: false,
            snackBarMessage: '',
            candidateCap: 10000
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let account = await self.getAccount()
            let contract = await self.TomoValidator.deployed()
            let cap = await contract.getCandidateCap(account)

            self.candidateCap = String(cap / 10 ** 18)
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        retire: async function () {
            let self = this
            try {
                if (self.isNotReady) {
                    self.$router.push('/setting')
                }

                self.$parent.showProgressBar = true

                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let rs = await contract.retire({ from: account })

                self.showSnackbar = true
                self.snackBarMessage = rs.tx ? 'You have successfully retired!'
                    : 'An error occurred while retiring, please try again'
                setTimeout(() => {
                    self.$parent.isCandidate = rs.tx === 'undefined'
                    self.$parent.showProgressBar = false
                    if (rs.tx) {
                        self.$router.push('/')
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
