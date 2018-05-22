<template>
    <div>
        <div class="table-container md-layout md-gutter md-alignment-top-center">
            <div class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
                <md-card>
                    <md-card-header>
                        <p class="md-title">Voter</p>
                        <p class="md-subhead">{{ voter }}</p>
                    </md-card-header>

                    <md-card-content>
                        <md-list class="md-double-line">
                            <md-list-item v-if="isReady">
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
            </div>
        </div>
        <div class="md-layout md-gutter md-alignment-center">
            <div
                v-if="candidates.length > 0"
                class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
                <md-table
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
    </div>
</template>
<script>
import axios from 'axios'
export default {
    name: 'App',
    data () {
        return {
            isReady: this.web3,
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

            if (typeof self.web3 !== 'undefined') {
                self.web3.eth.getBalance(voter, function (a, b) {
                    self.balance = b / 10 ** 18
                    if (a) {
                        throw Error(a)
                    }
                })
            }
        } catch (e) {
            console.log(e)
        }
    }
}
</script>
