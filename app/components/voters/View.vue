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
                :items="sortedCandidates"
                :fields="candidateFields"
                :current-page="currentPage"
                :per-page="perPage"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :show-empty="true"
                :class="`tomo-table tomo-table--voted${loading ? ' loading' : ''}`"
                empty-text="There are no candidates to show"
                stacked="md" >

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
                    slot="cap"
                    slot-scope="data">{{ formatCurrencySymbol(formatNumber(data.item.cap)) }}
                </template>
            </b-table>

            <b-pagination
                v-if="totalRows > 0 && totalRows > perPage"
                :total-rows="totalRows"
                :per-page="perPage"
                v-model="currentPage"
                align="center"
                class="tomo-pagination" />
        </div>
        <div
            :class="'container section section--voterrewards'
            + (loading ? ' tomo-loading' : '')">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-gift color-purple" />
                        <span>Voter Rewards</span>
                        <span class="text-truncate section-title__description">
                            Calculate Reward for Voter</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="voterRewards"
                :fields="voterRewardsFields"
                :current-page="voterRewardsCurrentPage"
                :sort-by.sync="voterRewardsSortBy"
                :sort-desc.sync="voterRewardsSortDesc"
                :per-page="voterRewardsPerPage"
                :show-empty="true"
                :class="`tomo-table tomo-table--voterrewards${loading ? ' loading' : ''}`"
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
                class="tomo-pagination" />
        </div>

        <div
            :class="'container section section--txs'
            + (loading ? ' tomo-loading' : '')">
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
                :current-page="txCurrentPage"
                :per-page="txPerPage"
                :show-empty="true"
                :class="`tomo-table tomo-table--transactions${loading ? ' loading' : ''}`"
                empty-text="There are no transactions to show"
                stacked="md" >

                <template
                    slot="id"
                    slot-scope="data">{{ data.item.id }}
                </template>

                <template
                    slot="candidate"
                    slot-scope="data">
                    <router-link
                        :to="'/candidate/' + data.item.candidate"
                        class="text-truncate">
                        {{ data.item.candidate }}
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
                    {{ isNaN(data.item.cap) ? '---' : formatCurrencySymbol(data.item.cap) }}
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
                class="tomo-pagination" />
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
                    sortable: true
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: false
                },
                {
                    key: 'cap',
                    label: 'Capacity',
                    sortable: true
                }
            ],
            sortBy: 'cap',
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
            txFields: [
                {
                    key: 'candidate',
                    label: 'Candidate',
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
            txTotalRows: 0
        }
    },
    computed: {
        sortedCandidates: function () {
            return this.candidates.slice().sort(function (a, b) {
                return b.cap - a.cap
            })
        }
    },
    watch: {
        $route (to, from) {
            this.voter = to.params.address.toLowerCase()
            this.getVoterData()
        }
    },
    update () {},
    created: async function () {
        let self = this
        self.config = await self.appConfig()

        self.getVoterData()
    },
    methods: {
        getEventClass (event) {
            let clazz = ''
            if (event === 'Unvote' || event === 'Resign') {
                clazz = 'color-pink'
            }

            return clazz
        },
        async getVoterData () {
            let self = this
            try {
                let voter = self.$route.params.address

                self.loading = true
                // Get all informations
                const candiatePromise = axios.get(`/api/voters/${voter}/candidates`)
                const rewardPromise = axios.get(`/api/voters/${voter}/rewards`)
                const txPromise = axios.get(`/api/transactions/voter/${voter}`)
                // const promises = await Promise.all([
                //     await axios.get(`/api/voters/${voter}/candidates`),
                //     await axios.get(`/api/voters/${voter}/rewards`),
                //     await axios.get(`/api/transactions/voter/${voter}`)
                // ])

                // Candidate table
                // let candidates = promises[0]
                let candidates = await candiatePromise

                candidates.data.map(async (c) => {
                    self.candidates.push({
                        address: c.candidate,
                        name: c.candidateName,
                        cap: new BigNumber(c.capacity).div(10 ** 18).toNumber()
                    })
                    self.totalVoted += new BigNumber(c.capacity).div(10 ** 18).toNumber()
                })

                self.totalRows = self.candidates.length

                if (typeof self.web3 !== 'undefined') {
                    self.web3.eth.getBalance(voter, function (a, b) {
                        self.balance = new BigNumber(b).div(10 ** 18).toNumber()
                        if (a) {
                            throw Error(a)
                        }
                    })
                }

                // voter reward table
                // let voterRewards = promises[1]
                let voterRewards = await rewardPromise

                voterRewards.data.map((r) => {
                    self.voterRewards.push({
                        epoch: r.epoch,
                        candidate: r.validator,
                        candidateName: r.candidateName,
                        startBlockNumber: r.startBlockNumber,
                        endBlockNumber: r.endBlockNumber,
                        signNumber: r.signNumber,
                        reward: new BigNumber(r.reward).toFixed(6),
                        createdAt: moment(r.createdAt).fromNow(),
                        dateTooltip: moment(r.createdAt).format('lll')
                    })
                })

                self.voterRewardsTotalRows = self.voterRewards.length

                // transaction table
                // let txs = promises[2]
                let txs = await txPromise

                txs.data.map((tx, idx) => {
                    self.transactions.push({
                        tx: tx.tx,
                        voter: tx.voter,
                        candidate: tx.candidate,
                        event: tx.event,
                        cap: new BigNumber(tx.capacity).div(10 ** 18).toNumber(),
                        createdAt: moment(tx.createdAt).fromNow()
                    })
                })

                self.txTotalRows = self.transactions.length

                self.loading = false
            } catch (e) {
                self.loading = false
                console.log(e)
            }
        }
    }
}
</script>
