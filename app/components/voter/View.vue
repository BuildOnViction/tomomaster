<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Voter</div>
                    <div class="md-subhead">{{ voter }}</div>
                </md-card-header>

                <md-card-content>
                    <p>Balance: <strong>{{ balance }} $TOMO</strong></p>
                    <p>Voted: <strong>{{ totalVoted }} $TOMO</strong></p>
                </md-card-content>

                <md-table>
                    <md-table-toolbar>
                        <div class="md-title">Candidates
                            <div class="md-subhead">People who you voted</div>
                        </div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Address</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                        <md-table-head/>
                    </md-table-row>

                    <md-table-row
                        v-for="(c, key) in candidates"
                        :key="key">
                        <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                        <md-table-cell>
                            <router-link :to="'/candidate/' + c.address">{{ c.address }}</router-link>
                        </md-table-cell>
                        <md-table-cell>{{ c.cap }} $TOMO</md-table-cell>
                        <md-table-cell>
                            <md-button
                                class="md-raised md-primary">Vote</md-button>
                            <md-button
                                class="md-raised md-accent">Unvote</md-button>
                        </md-table-cell>
                    </md-table-row>
                </md-table>
            </md-card>
        </div>
    </div>
</template>
<script>
export default {
    name: 'App',
    data () {
        return {
            voter: this.$route.params.address,
            candidates: [],
            balance: 0,
            totalVoted: 0
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
    update () {},
    created: async function () {
        let self = this
        try {
            let voter = self.$route.params.address
            let account = await self.getAccount()
            let contract = await self.TomoValidator.deployed()
            let candidates = await contract.getCandidates.call({ from: account })

            candidates.map(async (candidate) => {
                let voters = await contract.getVoters.call(candidate, { from: account })
                // console.log(candidate)
                // console.log(voters)

                voters.map(async (v) => {
                    if (v === voter) {
                        let cap = await contract.getVoterCap.call(candidate, v, { from: account })
                        self.totalVoted += parseFloat(cap / 10 ** 18)
                        self.candidates.push({
                            address: candidate,
                            cap: (cap / 10 ** 18)
                        })
                    }
                })
            })
            // let cap = await contract.getVoterCap.call()
            self.web3.eth.getBalance(voter, function (a, b) {
                self.balance = b / 10 ** 18
                if (a) {
                    console.log('Got an error', a)
                }
            })
        } catch (e) {
            console.log(e)
        }
    }
}
</script>
