<template>
    <div>
        <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.0.12/css/all.css"
            integrity="sha384-G0fIWCsCzJIMAVNQPfjH08cyYaUtMwjJwqiRKxxE/rx96Uroj1BtIQ6MLJuheaO9"
            crossorigin="anonymous">
        <div class="table-container md-layout md-gutter md-alignment-top-center">
            <div class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
                <md-card>
                    <md-card-header>
                        <md-content>
                            <div class="md-headline">Kevin Joy</div>
                            <div class="md-subhead">{{ candidate }}</div>
                        </md-content>
                    </md-card-header>

                    <md-card-content>
                        <md-content>
                            <a href="#"><md-icon class="fab fa-github" /></a>
                            <a href="#"><md-icon class="fab fa-linkedin" /></a>
                            <a href="#"><md-icon class="far fa-envelope" /></a>
                        </md-content>
                        <md-list class="md-double-line">
                            <md-list-item>
                                <md-icon md-src="/app/assets/tomo.svg" />
                                <div class="md-list-item-text">
                                    <span><strong>{{ cap }}</strong> $TOMO</span>
                                    <span>Capacity</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>arrow_upward</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ totalVoted }}</strong> $TOMO</span>
                                    <span>Total voted</span>
                                </div>
                            </md-list-item>
                            <md-list-item v-if="!isNotReady">
                                <md-icon>receipt</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ voted }}</strong> $TOMO</span>
                                    <span>You voted</span>
                                </div>
                            </md-list-item>
                        </md-list>
                    </md-card-content>

                    <md-card-actions>
                        <md-button
                            v-if="voted > 0"
                            :to="'/unvoting/' + candidate"
                            class="md-raised md-accent"><md-icon>arrow_downward</md-icon> Unvote</md-button>
                        <md-button
                            :to="'/voting/' + candidate"
                            class="md-raised md-primary"><md-icon>arrow_upward</md-icon> Vote</md-button>
                    </md-card-actions>
                </md-card>
            </div>
            <div
                v-if="voters.length > 0"
                class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
                <md-table
                    v-model="voters"
                    md-card
                    md-fixed-header
                    md-sort="cap"
                    md-sort-order="asc">
                    <md-table-toolbar>
                        <div class="md-title">Voters
                            <p class="md-subhead">People who voted for this candidate</p>
                        </div>
                    </md-table-toolbar>
                    <md-table-row
                        slot="md-table-row"
                        slot-scope="{ item }">
                        <md-table-cell
                            md-label="ID"
                            md-numeric>{{ item.id }}
                        </md-table-cell>
                        <md-table-cell
                            md-label="Address"
                            md-sort-by="address">
                            <router-link :to="'/voter/' + item.address">{{ item.address }}</router-link>
                        </md-table-cell>
                        <md-table-cell
                            md-numeric
                            md-label="Capacity"
                            md-sort-by="cap">{{ item.cap }} $TOMO
                        </md-table-cell>
                    </md-table-row>
                </md-table>
            </div>
            <div
                v-if="transactions.length > 0"
                class="md-layout-item md-xlarge-size-100 md-large-size-100 md-xsmall-size-100">
                <md-table
                    v-model="transactions"
                    md-card
                    md-fixed-header
                    md-sort="id"
                    md-sort-order="asc">
                    <md-table-toolbar>
                        <div class="md-title">Transactions
                            <p class="md-subhead">All transactions of this candidate</p>
                        </div>
                    </md-table-toolbar>
                    <md-table-row
                        slot="md-table-row"
                        slot-scope="{ item }">
                        <md-table-cell
                            md-numeric
                            md-label="ID">{{ item.id }}
                        </md-table-cell>
                        <md-table-cell
                            md-label="Voter"
                            md-sort-by="voter">
                            <router-link :to="'/voter/' + item.voter">{{ item.voter }}</router-link>
                        </md-table-cell>
                        <md-table-cell
                            md-label="Event"
                            md-sort-by="event">
                            <md-chip
                                :class="getChipClass(item.event)">{{ item.event }}</md-chip>
                        </md-table-cell>
                        <md-table-cell
                            md-numeric
                            md-label="Capacity"
                            md-sort-by="cap">
                            {{ item.cap }} $TOMO
                        </md-table-cell>
                        <md-table-cell
                            md-label="">
                            <md-button
                                :href="'http://explorer.tomochain.com/txs/' + item.tx"
                                target="_blank"
                                class="md-icon-button">
                                <md-icon>remove_red_eye</md-icon>
                                <md-tooltip md-direction="right">View on TOMO Explorer</md-tooltip>
                            </md-button>
                        </md-table-cell>
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
            isNotReady: !this.web3,
            voteActive: false,
            voteValue: 1,
            unvoteValue: 1,
            voters: [],
            transactions: [],
            candidate: this.$route.params.address,
            cap: 0,
            voted: 0,
            totalVoted: 0
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let candidate = self.candidate
            let account = self.isNotReady ? '' : await self.getAccount()
            let c = await axios.get(`/api/candidates/${candidate}`)
            self.cap = parseFloat(c.data.capacity) / 10 ** 18

            let voters = await axios.get(`/api/candidates/${candidate}/voters`)
            voters.data.map((v) => {
                self.voters.push({
                    address: v.voter,
                    cap: (v.capacity / 10 ** 18)
                })
                self.totalVoted += (v.capacity / 10 ** 18)
                if (v.voter === account) {
                    self.voted += (parseFloat(v.capacity) / 10 ** 18)
                }
            })
            self.voters.sort((a, b) => {
                return b.cap - a.cap
            }).map((v, i) => {
                v.id = i + 1
            })

            let txs = await axios.get(`/api/transactions/candidate/${candidate}`)
            txs.data.map((tx, idx) => {
                self.transactions.push({
                    id: idx + 1,
                    tx: tx.tx,
                    voter: tx.voter,
                    candidate: tx.candidate,
                    event: tx.event,
                    cap: (tx.capacity / 10 ** 18)
                })
            })
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        getChipClass (event) {
            let clazz = ''
            if (event === 'Vote') {
                clazz = 'md-primary'
            } else if (event === 'Unvote') {
                clazz = 'md-accent'
            }

            return clazz
        }
    }
}
</script>
