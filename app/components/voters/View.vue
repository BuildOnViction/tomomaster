<template>
    <div>
        <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.0.12/css/all.css"
            integrity="sha384-G0fIWCsCzJIMAVNQPfjH08cyYaUtMwjJwqiRKxxE/rx96Uroj1BtIQ6MLJuheaO9"
            crossorigin="anonymous">
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <p class="md-title">Voter</p>
                    <p class="md-subhead">{{ voter }}</p>
                </md-card-header>

                <md-card-content>
                    <md-list class="md-double-line">
                        <md-list-item>
                            <md-icon md-src="/app/assets/tomo.svg" />
                            <div class="md-list-item-text">
                                <span><strong>{{ balance }}</strong> $TOMO</span>
                                <span>Balance</span>
                            </div>
                        </md-list-item>
                        <md-list-item>
                            <md-icon>arrow_upward</md-icon>
                            <div class="md-list-item-text">
                                <span><strong>{{ totalVoted }}</strong> $TOMO</span>
                                <span>Total voted</span>
                            </div>
                        </md-list-item>
                    </md-list>
                </md-card-content>
            </md-card>
            <md-table
                v-if="candidates.length > 0"
                v-model="candidates"
                md-card
                md-fixed-header
                md-sort="cap"
                md-sort-order="asc">
                <md-table-toolbar>
                    <div class="md-title">Candidates
                        <p class="md-subhead">All candidates are voted by this voter</p>
                    </div>
                </md-table-toolbar>
                <md-table-row
                    slot="md-table-row"
                    slot-scope="{ item }">
                    <md-table-cell
                        md-label="ID"
                        md-numeric>{{ item.id }}</md-table-cell>
                    <md-table-cell
                        md-label="Candidate"
                        md-sort-by="address">
                        <router-link :to="'/candidate/' + item.address">{{ item.address }}</router-link>
                    </md-table-cell>
                    <md-table-cell
                        md-numeric
                        md-label="Capacity"
                        md-sort-by="cap">{{ item.cap }} $TOMO</md-table-cell>
                </md-table-row>
            </md-table>
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
                self.totalVoted += (c.capacity / 10 ** 18)
            })

            self.candidates.sort((a, b) => {
                return b.cap - a.cap
            }).map((c, i) => {
                c.id = i + 1
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
