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
                                <span>Total</span>
                            </div>
                        </md-list-item>

                        <md-list-item>
                            <md-icon class="far fa-thumbs-up"/>
                            <div class="md-list-item-text">
                                <span><strong>{{ iCap }}</strong> $TOMO</span>
                                <span>You voted</span>
                            </div>
                        </md-list-item>
                    </md-list>
                </md-card-content>

                <md-divider/>

                <md-card-actions>
                    <md-button
                        class="md-raised md-primary"
                        @click="voteActive = true;"><md-icon>arrow_upward</md-icon> Vote</md-button>
                    <md-button
                        class="md-raised md-accent"
                        @click="unvoteActive = true;"><md-icon>arrow_downward</md-icon> Unvote</md-button>
                </md-card-actions>

                <md-divider/>

                <md-table
                    v-if="voters.length > 0"
                    v-model="voters"
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
                            md-numeric>{{ item.id }}</md-table-cell>
                        <md-table-cell
                            md-label="Address"
                            md-sort-by="address">
                            <router-link :to="'/voter/' + item.address">{{ item.address }}</router-link>
                        </md-table-cell>
                        <md-table-cell
                            md-numeric
                            md-label="Capacity"
                            md-sort-by="cap">{{ item.cap }} $TOMO</md-table-cell>
                    </md-table-row>
                </md-table>
                <md-table v-if="transactions.length > 0">
                    <md-table-toolbar>
                        <div class="md-title">Transactions
                            <p class="md-subhead">All transactions for this candidate</p>
                        </div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Voter</md-table-head>
                        <md-table-head>Candidate</md-table-head>
                        <md-table-head>Event</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                    </md-table-row>

                    <md-table-row
                        v-for="(t, key) in transactions"
                        :key="key">
                        <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                        <md-table-cell>
                            <router-link :to="'/voter/' + t.voter">{{ t.voter }}</router-link>
                        </md-table-cell>
                        <md-table-cell>
                            {{ t.candidate }}
                        </md-table-cell>
                        <md-table-cell>
                            {{ t.event }}
                        </md-table-cell>
                        <md-table-cell>{{ t.cap }} $TOMO</md-table-cell>
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
import axios from 'axios'
export default {
    name: 'App',
    data () {
        return {
            voteActive: false,
            voteValue: 1,
            unvoteActive: false,
            unvoteValue: 1,
            voters: [],
            transactions: [],
            candidate: this.$route.params.address,
            cap: 0,
            iCap: 0
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let candidate = self.$route.params.address
            let voters = await axios.get(`/api/candidates/${candidate}/voters`)
            voters.data.map((v) => {
                self.voters.push({
                    address: v.voter,
                    cap: (v.capacity / 10 ** 18)
                })
            })
            self.voters.sort((a, b) => {
                return b.cap - a.cap
            }).map((v, i) => {
                v.id = i + 1
            })
            let txs = await axios.get(`/api/transactions/candidate/${candidate}`)
            txs.data.map(tx => {
                self.transactions.push({
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
                let cap = await contract.getCandidateCap.call(candidate, { from: account })
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
