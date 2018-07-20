<template>
    <div>
        <div class="container section section--candidate">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <i class="tm-flag color-yellow" />
                        <span>{{ candidate.name }}</span>
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
                        :class="'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info tomo-info-status--'
                        + candidate.status">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Note Status</span>
                        </p>
                        <p class="tomo-info__description">Active</p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Balance</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatCurrencySymbol(formatNumber(candidate.balance)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Capacity</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatCurrencySymbol(formatNumber(candidate.cap)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info tomo-info--big">
                        <p class="tomo-info__title">
                            <i class="tm-arrow-up tomo-info__icon" />
                            <span class="tomo-info__text">Total voted</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatCurrencySymbol(formatNumber(candidate.totalVoted)) }}
                        </p>
                    </div>
                    <div
                        v-if="isReady"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">You voted</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatCurrencySymbol(formatNumber(candidate.voted)) }}
                        </p>
                    </div>
                    <div
                        v-if="isReady"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Rewarded</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatCurrencySymbol(formatNumber(candidate.rewarded)) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Latest Block</span>
                        </p>
                        <p class="tomo-info__description">
                            #{{ formatNumber(candidate.latestBlock) }}
                        </p>
                    </div>
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Total Signed Blocks</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ formatNumber(candidate.totalSignedBlocks) }}
                        </p>
                    </div>
                    <div class="col-12 col-md-6 col-lg-6 col-xl-4 order-md-1 order-lg-0 m-xl-0 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">Hardware</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ candidate.hardwareInfo }}
                        </p>
                    </div>
                    <div
                        v-for="(value, key) in candidate.dataCenterInfo"
                        :key="key"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 m-xl-0 tomo-info">
                        <p class="tomo-info__title">
                            <i class="tm-dot tomo-info__icon" />
                            <span class="tomo-info__text">{{ key }}</span>
                        </p>
                        <p class="tomo-info__description">
                            {{ value }}
                        </p>
                    </div>
                </div>
                <b-card-footer
                    v-if="candidate.status !== 'RESIGNED'"
                    class="text-right">
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
        <div class="container section section--hardware">
            <div class="row">
                <div class="col-12 col-lg-6">
                    <h3 class="section-title">
                        <i class="tm-cpu color-pink" />
                        <span>CPUs</span>
                    </h3>
                    <iframe
                        src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain?
                        orgId=1&panelId=2"
                        width="100%"
                        frameborder="0" />
                    <iframe
                        src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain?
                        orgId=1&panelId=6"
                        width="100%"
                        frameborder="0" />
                </div>
                <div class="col-12 col-lg-6">
                    <h3 class="section-title">
                        <i class="tm-memory color-orange" />
                        <span>Memory</span>
                    </h3>
                    <iframe
                        src="https://grafana-testnet.tomochain.com/d-solo/GaPA-Y4mk/tomochain
                        ?orgId=1&panelId=4"
                        width="100%"
                        frameborder="0" />
                </div>
            </div>
        </div>
        <div class="container section section--signs">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-signer color-yellow" />
                        <span>Signs</span>
                        <span class="text-truncate section-title__description">
                            All transactions that the candidate signed</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="signs"
                :fields="signsFields"
                :current-page="signsCurrentPage"
                :per-page="signsPerPage"
                :sort-by.sync="signsSortBy"
                :sort-desc.sync="signsSortDesc"
                :show-empty="true"
                :class="`tomo-table tomo-table--signed${loading ? ' loading' : ''}`"
                empty-text="There are no transactions to show"
                stacked="md" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.item.id }}
                </template>

                <template
                    slot="blockNumber"
                    slot-scope="data">{{ data.item.blockNumber }}
                </template>

                <template
                    slot="tx"
                    slot-scope="data">
                    <a
                        v-b-tooltip.hover
                        v-b-tooltip.html.right
                        :href="`https://explorer-testnet.tomochain.com/txs/${data.item.tx}`"
                        title="View on TomoScan"
                        target="_blank"
                        class="text-truncate">
                        {{ data.item.tx }}
                    </a>
                </template>
            </b-table>

            <b-pagination
                v-if="signsTotalRows > 0 && signsTotalRows > signsPerPage"
                :total-rows="signsTotalRows"
                :per-page="signsPerPage"
                v-model="signsCurrentPage"
                align="center"
                class="tomo-pagination" />
        </div>
        <div class="container section section-voters">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-arrow-up color-pink" />
                        <span>Voters</span>
                        <span class="text-truncate section-title__description">
                            People who voted for this candidate</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="sortedVoters"
                :fields="voterFields"
                :current-page="voterCurrentPage"
                :per-page="voterPerPage"
                :show-empty="true"
                :class="`tomo-table tomo-table--voted${loading ? ' loading' : ''}`"
                empty-text="There are no voters to show"
                stacked="md" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.item.id }}
                </template>

                <template
                    slot="address"
                    slot-scope="data">
                    <router-link
                        :to="'/voter/' + data.item.address"
                        class="text-truncate">
                        {{ data.item.address }}
                    </router-link>
                </template>

                <template
                    slot="cap"
                    slot-scope="data">{{ formatCurrencySymbol(formatNumber(data.item.cap)) }}
                </template>
            </b-table>

            <b-pagination
                v-if="voterTotalRows > 0 && voterTotalRows > voterPerPage"
                :total-rows="voterTotalRows"
                :per-page="voterPerPage"
                v-model="voterCurrentPage"
                align="center"
                class="tomo-pagination" />
        </div>
        <div class="container section section--txs">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-time color-purple" />
                        <span>Transactions</span>
                        <span class="text-truncate section-title__description">
                            All transactions of this candidate</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="sortedTransactions"
                :fields="txFields"
                :current-page="txCurrentPage"
                :per-page="txPerPage"
                :sort-by.sync="txSortBy"
                :sort-desc.sync="txSortDesc"
                :show-empty="true"
                :class="`tomo-table tomo-table--transactions${loading ? ' loading' : ''}`"
                empty-text="There are no transactions to show"
                stacked="md" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.item.id }}
                </template>

                <template
                    slot="voter"
                    slot-scope="data">
                    <router-link
                        :to="'/voter/' + data.item.voter"
                        class="text-truncate">
                        {{ data.item.voter }}
                    </router-link>
                </template>

                <template
                    slot="event"
                    slot-scope="data">
                    <span :class="'fw-600 ' + getEventClass(data.item.event)">{{ data.item.event }}</span>
                </template>

                <template
                    slot="cap"
                    slot-scope="data">
                    {{ isNaN(data.item.cap) ? '---' : formatCurrencySymbol(formatNumber(data.item.cap)) }}
                </template>

                <template
                    slot="tx"
                    slot-scope="data">
                    <a
                        v-b-tooltip.hover
                        v-b-tooltip.html.right
                        :href="`https://explorer-testnet.tomochain.com/txs/${data.item.tx}`"
                        title="View on TomoScan"
                        target="_blank"
                        class="text-muted">
                        <i class="tm-eye" />
                        <span>View on TomoScan</span>
                    </a>
                </template>
            </b-table>

            <b-pagination
                v-if="txTotalRows > 0 && txTotalRows > txPerPage"
                :total-rows="txTotalRows"
                :per-page="txPerPage"
                v-model="txCurrentPage"
                align="center"
                class="tomo-pagination" />
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
            signs: [],
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
            },
            voterFields: [
                {
                    key: 'id',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'address',
                    label: 'Address',
                    sortable: true
                },
                {
                    key: 'cap',
                    label: 'Capacity',
                    sortable: true
                }
            ],
            voterSortBy: 'cap',
            voterSortDesc: true,
            voterCurrentPage: 1,
            voterPerPage: 10,
            voterTotalRows: 0,
            txFields: [
                {
                    key: 'id',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'voter',
                    label: 'Voter',
                    sortable: true
                },
                {
                    key: 'event',
                    label: 'Event',
                    sortable: true
                },
                {
                    key: 'cap',
                    label: 'Capacity',
                    sortable: true
                },
                {
                    key: 'tx',
                    label: '',
                    sortable: false
                }
            ],
            txSortBy: 'cap',
            txSortDesc: true,
            txCurrentPage: 1,
            txPerPage: 10,
            txTotalRows: 0,
            signsFields: [
                {
                    key: 'id',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'blockNumber',
                    label: 'Block Number',
                    sortable: false
                },
                {
                    key: 'tx',
                    label: 'Transaction Hash',
                    sortable: false
                }
            ],
            signsSortBy: 'blockNumber',
            signsSortDesc: true,
            signsCurrentPage: 1,
            signsPerPage: 10,
            signsTotalRows: 0,
            loading: false
        }
    },
    computed: {
        sortedVoters: function () {
            return this.voters.slice().sort(function (a, b) {
                return b.cap - a.cap
            })
        },
        sortedTransactions: function () {
            return this.transactions.slice().sort(function (a, b) {
                return b.cap - a.cap
            })
        }
    },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            let address = self.candidate.address
            let account = self.isReady ? await self.getAccount() : ''

            self.loading = true

            let c = await axios.get(`/api/candidates/${address}`)

            if (c.data) {
                let data = c.data
                self.candidate.name = data.name ? data.name : 'Anonymous Candidate'
                self.candidate.status = data.status
                self.candidate.cap = (new BigNumber(data.capacity)).div(10 ** 18).toString()
                self.candidate.rewarded = 1
                self.candidate.latestBlock = '123,456'
                self.candidate.totalSignedBlocks = data.totalSignedBlocks
                self.candidate.hardwareInfo = '2.9 GHz Intel Core i5/32 TB 1867 MHz DDR3'
                self.candidate.dataCenterInfo = {
                    name: 'AWS',
                    location: 'Singapre'
                }
            }

            if (self.web3) {
                self.web3.eth.getBalance(self.candidate.address, function (a, b) {
                    self.candidate.balance = new BigNumber(b).div(10 ** 18)
                    if (a) {
                        console.log('got an error', a)
                    }
                })
            }

            let voters = await axios.get(`/api/candidates/${address}/voters`)
            voters.data.map((v, idx) => {
                self.voters.push({
                    id: idx + 1,
                    address: v.voter,
                    cap: (new BigNumber(v.capacity).div(10 ** 18)).toNumber()
                })
                self.candidate.totalVoted += (new BigNumber(v.capacity).div(10 ** 18)).toNumber()

                if (v.voter === account) {
                    self.candidate.voted += (new BigNumber(v.capacity).div(10 ** 18)).toNumber()
                }
            })

            self.voterTotalRows = self.voters.length

            let txs = await axios.get(`/api/transactions/candidate/${address}`)
            txs.data.map((tx, idx) => {
                self.transactions.push({
                    id: idx + 1,
                    tx: tx.tx,
                    voter: tx.voter,
                    candidate: tx.candidate,
                    event: tx.event,
                    cap: (new BigNumber(tx.capacity)).div(10 ** 18).toNumber()
                })
            })

            self.txTotalRows = self.transactions.length

            let blockSigners = await axios.get(`/api/blocksigners/getByCandidate/${address}`)
            blockSigners.data.map((bs, idx) => {
                let stx = bs.signers.filter(s => {
                    return (s.signer === address)
                })
                self.signs.push({
                    id: idx + 1,
                    tx: stx[0].tx,
                    blockNumber: bs.blockNumber
                })
            })

            self.signsTotalRows = self.signs.length

            self.loading = false
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
        getEventClass (event) {
            let clazz = ''
            if (event === 'Unvote' || event === 'Resign') {
                clazz = 'color-pink'
            }

            return clazz
        }
    }
}
</script>
