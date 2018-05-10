<template>
    <div>
        <md-empty-state
            v-if="isNotReady"
            md-icon="account_balance_wallet"
            md-label="Disconnected!"
            md-description="Please setup your wallet provider.">
            <md-button
                class="md-raised"
                href="/setting">Change Settings</md-button>
        </md-empty-state>
        <div
            v-if="!isNotReady"
            class="table-container">
            <md-table md-card>
                <md-table-toolbar>
                    <div class="md-title">Candidates</div>
                </md-table-toolbar>

                <md-table-row>
                    <md-table-head md-numeric>ID</md-table-head>
                    <md-table-head>Address</md-table-head>
                    <md-table-head>Capacity</md-table-head>
                    <md-table-head/>
                </md-table-row>

                <md-table-row
                    v-for="(c, key) in sortedCandidates"
                    :key="key">
                    <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                    <md-table-cell>
                        <router-link :to="'/candidate/' + c.address">{{ c.address }}</router-link>
                    </md-table-cell>
                    <md-table-cell>{{ c.cap }} $TOMO</md-table-cell>
                    <md-table-cell><md-button
                        class="md-raised md-primary"
                        @click="voteActive = true; voteItem = c">Vote</md-button></md-table-cell>
                </md-table-row>
            </md-table>
        </div>
        <md-dialog-prompt
            :md-active.sync="voteActive"
            v-model="voteValue"
            md-title="How much?"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm"
            @md-confirm="vote()"/>
    </div>
</template>
<script>

export default {
    name: 'App',
    data () {
        return {
            isNotReady: !this.web3,
            voteActive: false,
            voteValue: 1,
            voteItem: {},
            candidates: []
        }
    },
    computed: {
        sortedCandidates: function () {
            return this.candidates.slice().sort(function (a, b) {
                return b.cap - a.cap
            })
        }
    },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            if (self.isNotReady) {
                throw Error('Is not ready')
            }
            let account = await self.getAccount()
            let contract = await self.TomoValidator.deployed()
            let candidates = await contract.getCandidates.call({ from: account })
            candidates.map(async (candidate) => {
                let cap = await contract.getCandidateCap.call(candidate, { from: account })
                self.candidates.push({
                    address: candidate,
                    cap: (cap / 10 ** 18)
                })
            })
        } catch (e) {
            self.isNotReady = true
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        vote: async function () {
            let self = this
            let candidate = this.voteItem
            let value = this.voteValue

            try {
                let account = await self.getAccount()
                let contract = await self.TomoValidator.deployed()
                await contract.vote(candidate.address, {
                    from: account,
                    value: parseFloat(value) * 10 ** 18
                })
                let cap = await contract.getCandidateCap.call(candidate.address, { from: candidate.address })
                candidate.cap = String(cap / 10 ** 18)
            } catch (e) {
                console.log(e)
            }
        }
    }
}
</script>
