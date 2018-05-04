<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Candidate</div>
                    <div class="md-subhead">{{ candidate }}</div>
                </md-card-header>

                <md-card-content>

                    <p>Total: {{ cap }} $TOMO</p>
                    <p>You voted: {{ iCap }} $TOMO</p>
                </md-card-content>

                <md-card-actions>
                    <md-button
                        class="md-primary"
                        @click="voteActive = true;"><md-icon>arrow_upward</md-icon> Vote</md-button>
                    <md-button
                        class="md-accent"
                        @click="unvoteActive = true;"><md-icon>arrow_downward</md-icon> Unvote</md-button>
                </md-card-actions>
                <md-table>
                    <md-table-toolbar>
                        <div class="md-title">Voters</div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Address</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                    </md-table-row>
                    <md-table-row
                        v-for="(v, key) in voters"
                        :key="key">
                        <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                        <md-table-cell>{{ v.address }}</md-table-cell>
                        <md-table-cell>{{ v.cap }}</md-table-cell>
                    </md-table-row>
                </md-table>
            </md-card>
        </div>
        <md-dialog-prompt
            :md-active.sync="voteActive"
            v-model="voteValue"
            md-title="How much?"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm"
            @md-confirm="vote()"/>
        <md-dialog-prompt
            :md-active.sync="unvoteActive"
            v-model="unvoteValue"
            md-title="How much?"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm"
            @md-confirm="unvote()"/>
    </div>
</template>
<script>
export default {
    name: 'App',
    data () {
        return {
            voteActive: false,
            voteValue: 1,
            unvoteActive: false,
            unvoteValue: 1,
            voters: [],
            candidate: this.$route.params.address,
            cap: 0,
            iCap: 0
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let candidate = self.$route.params.address
            let account = await self.getAccount()
            let contract = await self.TomoValidator.deployed()
            let cap = await contract.getCandidateCap.call(candidate, { from: account })
            let iCap = await contract.getVoterCap.call(candidate, account, { from: account })
            let voters = await contract.getVoters.call(candidate, { from: account })

            self.cap = String(cap / 10 ** 18)
            self.iCap = String(iCap / 10 ** 18)
            voters.map(async (voter) => {
                let voterCap = await contract.getVoterCap.call(candidate, voter, { from: account })
                self.voters.push({
                    address: voter,
                    cap: String(voterCap / 10 ** 18)
                })
            })
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        vote: async function () {
            let self = this
            let candidate = this.candidate
            let value = this.voteValue

            try {
                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                await contract.vote(candidate, {
                    from: account,
                    value: parseFloat(value) * 10 ** 18
                })
                let cap = await contract.getCandidateCap.call(candidate, { from: candidate.address })
                self.cap = String(cap / 10 ** 18)
            } catch (e) {
                console.log(e)
            }
        },
        unvote: async function () {
            let self = this
            let candidate = this.candidate
            let value = this.voteValue

            try {
                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                await contract.unvote(candidate, String(parseFloat(value) * 10 ** 18), { from: account })
                let cap = await contract.getCandidateCap.call(candidate, { from: account })
                self.cap = String(cap / 10 ** 18)
            } catch (e) {
                console.log(e)
            }
        }
    }
}
</script>
