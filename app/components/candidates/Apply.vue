<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Become a Candidate</div>
                </md-card-header>

                <md-card-content>
                    You have to:
                    <ul>
                        <li>Deposit at least 10000 $TOMO</li>
                        <li>Your deposit will be locked</li>
                    </ul>
                    Gains:
                    <ul>
                        <li>Coin holder is able to vote for you to become a validator</li>
                    </ul>
                </md-card-content>

                <md-card-actions>
                    <md-button
                        v-if="!isCandidate"
                        class="md-primary"
                        @click="applyActive = true;"><md-icon>arrow_upward</md-icon> Apply</md-button>
                </md-card-actions>
            </md-card>
        </div>
        <md-dialog-prompt
            :md-active.sync="applyActive"
            v-model="applyValue"
            md-title="How much? (at least 10000 $TOMO)"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm"
            @md-confirm="apply()"/>
        <md-snackbar
            :md-active.sync="showSnackbar"
            md-position="center"
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
            applyActive: false,
            showSnackbar: false,
            snackBarMessage: '',
            isCandidate: false,
            applyValue: 10000
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
            self.isCandidate = await contract.isCandidate(account, { from: account })
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        apply: async function () {
            let self = this
            let value = this.applyValue
            try {
                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                let result = await contract.propose({
                    from: account,
                    value: parseFloat(value) * 10 ** 18
                })

                self.isCandidate = true
                self.showSnackbar = true
                self.snackBarMessage = result.tx ? 'You have successfully applied!'
                    : 'An error occurred while applying, please try again'
            } catch (e) {
                self.showSnackbar = true
                self.snackBarMessage = 'An error occurred while applying, please try again'
                console.log(e)
            }
        }
    }
}
</script>
