<template>
    <div>
        <div class="container section section--candidate">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <i class="tm-flag color-yellow" />
                        <span>Candidate</span>
                        <span class="text-truncate section-title__description">{{ candidate.address }}</span>
                        <ul class="list-inline social-links">
                            <li
                                v-for="(value, key) in candidate.socialInfo"
                                :key="key"
                                class="list-inline-item social-links__item">
                                <a
                                    :href="value"
                                    class="social-links__link">
                                    <i :class="'social-links__icon tm-' + key" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <b-card class="tomo-card tomo-card--animated tomo-card--candidate">
                <div class="row m-md-0">
                    <div
                        :class="'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info candidate-info-status--'
                        + candidate.status">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Note Status</span>
                        </p>
                        <p class="candidate-info__description">Active</p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Balance</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatCurrenctySymbol(formatNumber(candidate.balance)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Capacity</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatCurrenctySymbol(formatNumber(candidate.cap)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info candidate-info--big">
                        <p class="candidate-info__title">
                            <i class="tm-arrow-up candidate-info__icon" />
                            <span class="candidate-info__text">Total voted</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatCurrenctySymbol(formatNumber(candidate.totalVoted)) }}
                        </p>
                    </div>
                    <div
                        v-if="isReady"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">You voted</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatCurrenctySymbol(formatNumber(candidate.voted)) }}
                        </p>
                    </div>
                    <div
                        v-if="isReady"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Rewarded</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatCurrenctySymbol(formatNumber(candidate.rewarded)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Latest Block</span>
                        </p>
                        <p class="candidate-info__description">
                            #{{ formatNumber(candidate.latestBlock) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Total Signed Blocks</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ formatNumber(candidate.totalSignedBlocks) }}
                        </p>
                    </div>
                    <div class="col-12 col-md-6 col-lg-6 col-xl-4 order-md-1 order-lg-0 m-xl-0 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">Hardware</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ candidate.hardwareInfo }}
                        </p>
                    </div>
                    <div
                        v-for="(value, key) in candidate.dataCenterInfo"
                        :key="key"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 candidate-info">
                        <p class="candidate-info__title">
                            <i class="tm-dot candidate-info__icon" />
                            <span class="candidate-info__text">{{ key }}</span>
                        </p>
                        <p class="candidate-info__description">
                            {{ value }}
                        </p>
                    </div>
                </div>
                <b-card-footer class="text-right">
                    <b-button
                        v-if="candidate.voted > 0"
                        :to="`/unvoting/${candidate.address}`"
                        variant="secondary">Unvote</b-button>
                    <b-button
                        :to="`/voting/${candidate.address}`"
                        variant="primary">Vote</b-button>
                </b-card-footer>
            </b-card>
        </div>
        <div class="container md-layout md-gutter md-alignment-top-center">
            <div
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>

                    <md-card-actions>
                        <md-card-expand-trigger>
                            <md-button class="md-icon-button">
                                <md-icon>keyboard_arrow_down</md-icon>
                            </md-button>
                        </md-card-expand-trigger>
                        <md-button
                            v-if="candidate.voted > 0"
                            :to="'/unvoting/' + candidate.address"
                            class="md-raised md-accent"><md-icon>arrow_downward</md-icon> Unvote</md-button>
                        <md-button
                            :to="'/voting/' + candidate.address"
                            class="md-raised md-primary"><md-icon>arrow_upward</md-icon> Vote</md-button>
                    </md-card-actions>
                </md-card>
            </div>
            <div
                v-if="voters.length > 0"
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
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
                class="md-layout-item md-xlarge-size-100 md-large-size-100
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>
                    <md-card-header>
                        <md-content>
                            <div class="md-headline">
                                CPUs
                            </div>
                        </md-content>
                    </md-card-header>

                    <md-card-content>
                        <!-- <iframe
                            src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain?
                            orgId=1&panelId=2&theme=light"
                            width="1200"
                            frameborder="0" />
                        <iframe
                            src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain?
                            orgId=1&panelId=6&theme=light"
                            width="1200"
                            frameborder="0" /> -->
                    </md-card-content>
                </md-card>
            </div>
            <div
                class="md-layout-item md-xlarge-size-100 md-large-size-100
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>
                    <md-card-header>
                        <md-content>
                            <div class="md-headline">
                                Memory
                            </div>
                        </md-content>
                    </md-card-header>

                    <md-card-content>
                        <!-- <iframe
                            src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain
                            ?orgId=1&panelId=4&theme=light"
                            width="1200"
                            frameborder="0" /> -->
                    </md-card-content>
                </md-card>
            </div>
            <div
                v-if="transactions.length > 0"
                class="md-layout-item md-xlarge-size-100 md-large-size-100
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
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
                            {{ isNaN(item.cap) ? '--' : item.cap + ' $TOMO' }}
                        </md-table-cell>
                        <md-table-cell
                            md-label="">
                            <md-button
                                :href="'https://explorer-testnet.tomochain.com/txs/' + item.tx"
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
import BigNumber from 'bignumber.js'

export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            voteActive: false,
            voteValue: 1,
            unvoteValue: 1,
            voters: [],
            transactions: [],
            candidate: {
                address: this.$route.params.address,
                name: '',
                balance: '',
                status: 'active',
                cap: 0,
                latestBlock: '',
                totalSignedBlocks: 0,
                rewarded: 0,
                hardwareInfo: '',
                dataCenterInfo: {},
                socialInfo: {
                    github: '#',
                    linkedin: '#',
                    email: '#'
                },
                voted: 0,
                totalVoted: 0
            }
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let address = self.candidate.address
            let account = self.isReady ? await self.getAccount() : ''
            let c = await axios.get(`/api/candidates/${address}`)

            if (c.data) {
                let data = c.data
                self.candidate.name = data.name ? data.name : 'Anonymous Candidate'
                self.candidate.cap = (new BigNumber(data.capacity)).div(10 ** 18).toString()
                self.candidate.rewarded = 1
                self.candidate.latestBlock = '123,456'
                self.candidate.totalSignedBlocks = 100
                self.candidate.hardwareInfo = '2.9 GHz Intel Core i5/32 TB 1867 MHz DDR3'
                self.candidate.dataCenterInfo = {
                    name: 'AWS',
                    location: 'Singapre'
                }
            }

            if (self.web3) {
                self.web3.eth.getBalance(self.candidate.address, function (a, b) {
                    self.candidate.balance = b / 10 ** 18
                    if (a) {
                        console.log('got an error', a)
                    }
                })
            }

            let voters = await axios.get(`/api/candidates/${address}/voters`)
            voters.data.map((v) => {
                self.voters.push({
                    address: v.voter,
                    cap: (v.capacity / 10 ** 18)
                })
                self.candidate.totalVoted += (v.capacity / 10 ** 18)
                if (v.voter === account) {
                    self.candidate.voted += (parseFloat(v.capacity) / 10 ** 18)
                }
            })
            self.voters.sort((a, b) => {
                return b.cap - a.cap
            }).map((v, i) => {
                v.id = i + 1
            })

            let txs = await axios.get(`/api/transactions/candidate/${address}`)
            txs.data.map((tx, idx) => {
                self.transactions.push({
                    id: idx + 1,
                    tx: tx.tx,
                    voter: tx.voter,
                    candidate: tx.candidate,
                    event: tx.event,
                    cap: (new BigNumber(tx.capacity)).div(10 ** 18).toString()
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
