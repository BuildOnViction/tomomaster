<template>
    <div>
        <md-empty-state
            v-if="!isCandidate"
            md-icon="account_circle"
            md-label="Opps!!"
            md-description="You are not a candidate, so you cannot retire">
            <md-button class="md-primary md-raised" to="/apply">Become a candidate</md-button>
        </md-empty-state>
        <div class="table-container" v-if="isCandidate">
            <md-card>
                <md-card-header>
                    <div class="md-title">Retire</div>
                </md-card-header>
                
                <md-card-content>
                    You deposited <b>{{ candidateCap }}</b>. We will return this deposit to you.
                </md-card-content>

                <md-card-actions>
                    <md-button v-if="isCandidate" @click="retireActive = true;" class="md-accent"><md-icon>arrow_downward</md-icon> Retire</md-button>
                </md-card-actions>
            </md-card>
        </div>
        <md-dialog-confirm
            :md-active.sync="retireActive"
            md-title="Do you want to retire?"
            md-content="If you retire, you will receive back all your deposit."
            md-confirm-text="Confirm" @md-confirm="retire()"/>
        <md-snackbar 
            :md-active.sync="showSnackbar"
            md-position="center"
            md-persistent>
            <span>You have successfully retired. Thank you!</span>
            <md-button class="md-primary" @click="showSnackbar = false">OK</md-button>
        </md-snackbar>
    </div>
</template>
<script>
export default {
    name: 'app',
    data() {
        return { 
            retireActive: false,
            showSnackbar: false,
            isCandidate: true,
            candidateCap: 10000,
        }
    },
    computed: { },
    watch: {},
    updated() {},
    created() {
        var self = this
        ;(async () => {
            try {
                var account = await self.getAccount()
                var contract = await self.TomoValidator.deployed()
                self.isCandidate = await contract.isCandidate(account)
                self.candidateCap = await contract.getCandidateCap(account)

                self.candidateCap = String(self.candidateCap/10**18) + ' $TOMO'
            }
            catch(e){
                console.log(e)
            }
        })()
    },
    mounted() {
    },
    methods: {
        retire: async function() {
            var self = this
            try {
                var account = await self.getAccount()
                var contract = await self.TomoValidator.deployed()
                await contract.retire({from: account})
                self.showSnackbar = true
            } catch (e) {
                console.log(e)
            }
        }
    }
}
</script>
