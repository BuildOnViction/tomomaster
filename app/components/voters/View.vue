<template>
    <div>
        <div class="container section section--voter">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <i class="tm-arrow-up color-pink" />
                        <span>Voter</span>
                        <span class="text-truncate section-title__description">{{ voter }}</span>
                    </div>
                </div>
            </div>
            <div class="row row-grid">
                <div
                    v-if="isReady"
                    class="col-12 tomo-info">
                    <p class="tomo-info__title">
                        <i class="tm-dot tomo-info__icon" />
                        <span class="tomo-info__text">Balance</span>
                    </p>
                    <p
                        id="tomo-info__description--balance"
                        class="tomo-info__description">
                        {{ formatCurrencySymbol(formatBigNumber(balance, 3)) }}
                        <b-tooltip
                            v-if="checkLongNumber(balance)"
                            ref="tooltip"
                            target="tomo-info__description--balance">
                            {{ formatCurrencySymbol(formatBigNumber(balance, 6)) }}
                        </b-tooltip>
                    </p>
                </div>
                <div class="col-12 tomo-info">
                    <p class="tomo-info__title">
                        <i class="tm-dot tomo-info__icon" />
                        <span class="tomo-info__text">Total voted</span>
                    </p>
                    <p
                        id="tomo-info__description--voted"
                        class="tomo-info__description">
                        {{ formatCurrencySymbol(formatNumber(totalVoted)) }}
                        <b-tooltip
                            v-if="checkLongNumber(totalVoted)"
                            ref="tooltip"
                            target="tomo-info__description--voted">
                            {{ formatCurrencySymbol(formatBigNumber(totalVoted, 6)) }}
                        </b-tooltip>
                    </p>
                </div>
            </div>
        </div>
        <div
            :class="'container section section--candiates mt-5'
            + (loading ? ' tomo-loading' : '')">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <i class="tm-flag color-yellow" />
                        <span>Candidates</span>
                        <span class="text-truncate section-title__description">
                            All candidates are voted by this voter</span>
                    </div>
                </div>
            </div>
            <b-table
                :items="candidates"
                :fields="candidateFields"
                :per-page="perPage"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :show-empty="true"
                :class="`tomo-table tomo-table--voted${loading ? ' loading' : ''}`"
                empty-text="There are no candidates to show"
                stacked="md"
                @sort-changed="sortingChangeCandidate" >

                <template
                    slot="index"
                    slot-scope="data">{{ data.index + 1 }}
                </template>

                <template
                    slot="address"
                    slot-scope="data">
                    <router-link
                        :to="'/candidate/' + data.item.address"
                        class="text-truncate">
                        {{ data.item.address }}
                    </router-link>
                </template>

                <template
                    slot="capacity"
                    slot-scope="data">
                    {{ isNaN(data.item.capacity) ? '---' : formatCurrencySymbol(data.item.capacity) }}
                    <span
                        v-if="data.item.owner == voter"
                        :id="`mnowner__${data.index}`">*</span>
                    <b-tooltip :target="`mnowner__${data.index}`">
                        This voter owns this node
                    </b-tooltip>
                </template>

                <template
                    slot="totalCapacity"
                    slot-scope="data">{{ formatCurrencySymbol(formatBigNumber(data.item.totalCapacity, 3)) }}
                </template>
            </b-table>

            <b-pagination
                v-if="totalRows > 0 && totalRows > perPage"
                :total-rows="totalRows"
                :per-page="perPage"
                v-model="currentPage"
                align="center"
                class="tomo-pagination"
                @change="candidatePageChange" />
        </div>
        <div
            :class="'container section section--voterrewards'
            + (rewardLoading ? ' tomo-loading' : '')">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-gift color-purple" />
                        <span>Voter Rewards</span>
                        <span class="text-truncate section-title__description">
                            All Reward for Voter</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="voterRewards"
                :fields="voterRewardsFields"
                :sort-by.sync="voterRewardsSortBy"
                :sort-desc.sync="voterRewardsSortDesc"
                :per-page="voterRewardsPerPage"
                :show-empty="true"
                :class="`tomo-table tomo-table--voterrewards${rewardLoading ? ' loading' : ''}`"
                empty-text="There are no rewards to show"
                stacked="md" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.index + 1 }}
                </template>

                <template
                    slot="checkpoint"
                    slot-scope="data">{{ data.item.checkpoint }}
                </template>

                <template
                    slot="reward"
                    slot-scope="data">
                    {{ formatCurrencySymbol(formatNumber(data.item.reward)) }}
                </template>

                <template
                    slot="candidateName"
                    slot-scope="data">
                    <router-link
                        :to="'/candidate/' + data.item.candidate"
                        class="text-truncate">
                        {{ data.item.candidateName }}
                    </router-link>
                </template>

                <template
                    slot="createdAt"
                    slot-scope="data">
                    <span :id="`timestamp__${data.index}`">{{ data.item.createdAt }}</span>
                    <b-tooltip :target="`timestamp__${data.index}`">
                        {{ data.item.dateTooltip }}
                    </b-tooltip>
                </template>

            </b-table>

            <b-pagination
                v-if="voterRewardsTotalRows > 0 && voterRewardsTotalRows > voterRewardsPerPage"
                :total-rows="voterRewardsTotalRows"
                :per-page="voterRewardsPerPage"
                v-model="voterRewardsCurrentPage"
                align="center"
                class="tomo-pagination"
                @change="rewardPageChange" />
        </div>

        <div
            :class="'container section section--txs'
            + (txLoading ? ' tomo-loading' : '')">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-time color-purple" />
                        <span>Transactions</span>
                        <span class="text-truncate section-title__description">
                            All transactions of this voter</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="transactions"
                :fields="txFields"
                :per-page="txPerPage"
                :show-empty="true"
                :class="`tomo-table tomo-table--transactions-voter${txLoading ? ' loading' : ''}`"
                empty-text="There are no transactions to show"
                stacked="md"
                @sort-changed="sortingChangeTxes" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.item.id }}
                </template>

                <template
                    slot="candidate"
                    slot-scope="data">
                    <router-link
                        :to="'/candidate/' + data.item.candidate">
                        {{ truncate(data.item.candidate, 20) }}
                    </router-link>
                </template>

                <template
                    slot="event"
                    slot-scope="data">
                    <span :class="'fw-600 ' + getEventClass(data.item.event)">{{ data.item.event }}</span>
                </template>

                <template
                    slot="capacity"
                    slot-scope="data">
                    {{ isNaN(data.item.cap) ? '---' : formatCurrencySymbol(data.item.cap) }}
                </template>

                <template
                    slot="candidateCap"
                    slot-scope="data">
                    {{ isNaN(data.item.candidateCap) ? '---' : formatCurrencySymbol(data.item.candidateCap) }}
                </template>

                <template
                    slot="tx"
                    slot-scope="data">
                    <a
                        v-b-tooltip.hover.right
                        :href="`${config.explorerUrl}/txs/${data.item.tx}`"
                        title="View on TomoScan"
                        target="_blank">
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
                class="tomo-pagination"
                @change="txPageChange" />
        </div>
    </div>
</template>
<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'
import moment from 'moment'

export default {
    name: 'App',
    data () {
        return {
            candidateFields: [
                {
                    key: 'address',
                    label: 'Address',
                    sortable: false
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: false
                },
                {
                    key: 'status',
                    label: 'Status',
                    sortable: false
                },
                {
                    key: 'status',
                    label: 'Status',
                    sortable: false
                },
                {
                    key: 'capacity',
                    label: 'Voted Capacity',
                    sortable: true
                },
                {
                    key: 'totalCapacity',
                    label: 'Capacity',
                    sortable: true
                }
            ],
            sortBy: 'capacity',
            sortDesc: true,
            isReady: !!this.web3,
            voter: this.$route.params.address.toLowerCase(),
            candidates: [],
            balance: 0,
            totalVoted: 0,
            currentPage: 1,
            perPage: 10,
            totalRows: 0,
            voterRewards: [],
            voterRewardsFields: [
                {
                    key: 'epoch',
                    label: 'Epoch',
                    sortable: false
                },
                {
                    key: 'candidateName',
                    label: 'Masternode',
                    sortable: false
                },
                {
                    key: 'signNumber',
                    label: 'Sign No.',
                    sortable: false
                },
                {
                    key: 'reward',
                    label: 'Reward',
                    sortable: false
                },
                {
                    key: 'createdAt',
                    label: 'Age',
                    sortable: false
                }
            ],
            voterRewardsCurrentPage: 1,
            voterRewardsSortBy: 'epoch',
            voterRewardsPerPage: 10,
            voterRewardsSortDesc: true,
            voterRewardsTotalRows: 0,
            loading: false,
            rewardLoading: false,
            txLoading: false,
            txFields: [
                {
                    key: 'candidate',
                    label: 'Address',
                    sortable: false
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: false
                },
                {
                    key: 'event',
                    label: 'Event',
                    sortable: true
                },
                {
                    key: 'capacity',
                    label: 'Amount',
                    sortable: true
                },
                {
                    key: 'candidateCap',
                    label: 'Capacity',
                    sortable: true
                },
                {
                    key: 'createdAt',
                    label: 'Age',
                    sortable: false
                },
                {
                    key: 'tx',
                    label: '',
                    sortable: false
                }
            ],
            transactions: [],
            txCurrentPage: 1,
            txPerPage: 10,
            txTotalRows: 0,
            txSortBy: 'createdAt',
            txSortDesc: true
        }
    },
    computed: { },
    watch: {
        $route (to, from) {
            this.voter = to.params.address.toLowerCase()
            this.getCandidates()
            this.getTransactions()
            this.getRewards()
        }
    },
    update () {},
    created: async function () {
        let self = this
        self.config = await self.appConfig()

        self.getCandidates()
        self.getRewards()
        self.getTransactions()
    },
    methods: {
        getEventClass (event) {
            let clazz = ''
            if (event === 'Unvote' || event === 'Resign') {
                clazz = 'color-pink'
            }

            return clazz
        },
        async getCandidates () {
            let self = this
            try {
                let voter = self.$route.params.address

                self.loading = true
                const params = {
                    page: self.currentPage,
                    limit: self.perPage,
                    sortBy: self.sortBy,
                    sortDesc: self.sortDesc
                }
                const candiatePromise = axios.get(`/api/voters/${voter}/candidates?${self.serializeQuery(params)}`)

                // Candidate table
                let candidates = await candiatePromise
                let items = []

                candidates.data.items.map(async (c) => {
                    items.push({
                        address: c.candidate,
                        name: c.candidateName,
                        status: c.status,
                        owner: c.owner,
                        capacity: new BigNumber(c.capacity).div(10 ** 18).toNumber(),
                        totalCapacity: new BigNumber(c.totalCapacity).div(10 ** 18).toNumber()
                    })
                })

                self.totalVoted = candidates.data.totalVoted
                self.candidates = items

                self.totalRows = candidates.data.total

                if (typeof self.web3 !== 'undefined') {
                    self.web3.eth.getBalance(voter, function (a, b) {
                        self.balance = new BigNumber(b).div(10 ** 18).toNumber()
                        if (a) {
                            throw Error(a)
                        }
                    })
                }

                self.loading = false
            } catch (e) {
                self.loading = false
                console.log(e)
            }
        },
        async getTransactions () {
            try {
                const self = this
                const voter = self.$route.params.address
                self.txLoading = true
                const params = {
                    page: self.txCurrentPage,
                    limit: self.txPerPage,
                    sortBy: self.txSortBy,
                    sortDesc: self.txSortDesc
                }

                const txPromise = axios.get(`/api/transactions/voter/${voter}?${self.serializeQuery(params)}`)

                // transaction table
                let txs = await txPromise
                let items = []

                txs.data.items.map((tx, idx) => {
                    items.push({
                        tx: tx.tx,
                        voter: tx.voter,
                        candidate: tx.candidate,
                        event: tx.event,
                        cap: new BigNumber(tx.capacity).div(10 ** 18).toNumber(),
                        createdAt: moment(tx.createdAt).fromNow(),
                        name: tx.name,
                        candidateCap: (new BigNumber(tx.currentCandidateCap).div(10 ** 18).toNumber()) || '---'
                    })
                })
                self.transactions = items

                self.txTotalRows = txs.data.total
                self.txLoading = false
            } catch (error) {
                self.txLoading = false
                console.log(error)
            }
        },
        async getRewards () {
            try {
                const self = this
                const voter = self.$route.params.address
                self.rewardLoading = true

                const params = {
                    page: self.voterRewardsCurrentPage,
                    limit: self.voterRewardsPerPage
                }

                const rewardPromise = axios.get(`/api/voters/${voter}/rewards?${self.serializeQuery(params)}`)

                // voter reward table
                let voterRewards = await rewardPromise
                let items = []

                voterRewards.data.items.map((r) => {
                    items.push({
                        epoch: r.epoch,
                        candidate: r.validator,
                        candidateName: r.candidateName,
                        startBlockNumber: r.startBlockNumber,
                        endBlockNumber: r.endBlockNumber,
                        signNumber: r.signNumber,
                        reward: new BigNumber(r.reward).toFixed(6),
                        createdAt: moment(r.rewardTime).fromNow(),
                        dateTooltip: moment(r.rewardTime).format('lll')
                    })
                })
                self.voterRewards = items

                self.voterRewardsTotalRows = voterRewards.data.total
                self.rewardLoading = false
            } catch (error) {
                self.rewardLoading = false
                console.log(error)
            }
        },
        txPageChange (val) {
            if (this.txCurrentPage !== val) {
                this.txCurrentPage = val
                this.getTransactions()
            }
        },
        rewardPageChange (val) {
            if (this.voterRewardsCurrentPage !== val) {
                this.voterRewardsCurrentPage = val
                this.getRewards()
            }
        },
        candidatePageChange (val) {
            if (this.currentPage !== val) {
                this.currentPage = val
                this.getCandidates()
            }
        },
        sortingChangeCandidate (obj) {
            if (obj.sortBy === 'totalCapacity') {
                return this.candidates.slice().sort(function (a, b) {
                    return b.totalCapacity - a.totaCapacity
                })
            }
            this.sortBy = obj.sortBy
            this.sortDesc = obj.sortDesc
            this.getCandidates()
        },
        sortingChangeTxes (obj) {
            this.txSortBy = obj.sortBy
            this.txSortDesc = obj.sortDesc
            this.getTransactions()
        }
    }
}
</script>
