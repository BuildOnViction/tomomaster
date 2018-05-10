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
                            <div class="md-subhead">All candidates are voted by this voter</div>
                        </div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Address</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                    </md-table-row>

                    <md-table-row
                        v-for="(c, key) in candidates"
                        :key="key">
                        <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                        <md-table-cell>
                            <router-link :to="'/candidate/' + c.address">{{ c.address }}</router-link>
                        </md-table-cell>
                        <md-table-cell>{{ c.cap }} $TOMO</md-table-cell>
                    </md-table-row>
                </md-table>
            </md-card>
        </div>
    </div>
</template>
<script>
import axios from 'axios'
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
            let candidates = await axios.get(`/api/voters/${voter}/candidates`)

            candidates.data.map(async (c) => {
                self.candidates.push({
                    address: c.candidate,
                    cap: (c.capacity / 10 ** 18)
                })
            })

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
