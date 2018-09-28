<template>
    <div>
        <div
            class="container section section--status">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-bolt color-pink" />
                        <span>Network Status</span>
                    </h3>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">Current Block</h6>
                        <p class="tomo-card__text">
                            <router-link :to="'/blocksigners'">#{{ chainConfig.blockNumber }}</router-link>
                        </p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">Block Time</h6>
                        <p class="tomo-card__text">{{ chainConfig.blockTime }}.00 s</p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">epoch</h6>
                        <p class="tomo-card__text">{{ chainConfig.epoch }} blocks</p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">Next Checkpoint</h6>
                        <p class="tomo-card__text">
                            <!-- eslint-disable-next-line max-len -->
                            #{{ parseInt(chainConfig.epoch) * (Math.floor(parseInt(chainConfig.blockNumber) / parseInt(chainConfig.epoch) + 1)) }}</p>
                    </b-card>
                </div>
            </div>
        </div>

        <div
            v-if="candidates.length <= 0"
            class="tomo-loading"/>

        <div
            v-else
            class="container">
            <div class="row">
                <div class="col-12">
                    <h3 class="section-title">
                        <i class="tm-flag color-yellow" />
                        <span>Candidates</span>
                    </h3>
                </div>
            </div>
            <b-table
                :items="sortedCandidates"
                :fields="fields"
                :current-page="currentPage"
                :per-page="perPage"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :class="'tomo-table tomo-table--candidates ' + tableCssClass"
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

                <template
                    slot="status"
                    slot-scope="data">
                    <div class="mt-2 mt-lg-0">
                        <span
                            v-if="!data.item.isMasternode"
                            :class="'tomo-chip '
                            + (data.item.status === 'PROPOSED' ? 'tomo-chip--primary' : 'tomo-chip--accent') ">
                            {{ data.item.status.toUpperCase() }}
                        </span>
                        <span
                            v-if="data.item.isMasternode"
                            class="tomo-chip tomo-chip--primary tomo-chip--masternode">MASTERNODE</span>
                    </div>
                </template>

                <template
                    v-if="data.item.owner === account"
                    slot="action-alt"
                    slot-scope="data">
                    <b-button
                        v-if="data.item.status === 'PROPOSED'"
                        :to="`/resign/${data.item.address}`"
                        variant="secondary"
                        class="d-none d-lg-block">Resign</b-button>
                </template>

                <template
                    slot="action"
                    slot-scope="data">
                    <b-button
                        v-if="data.item.status === 'PROPOSED'"
                        :to="`/voting/${data.item.address}`"
                        variant="primary"
                        class="mt-3 mt-lg-0">Vote</b-button>
                    <b-button
                        v-if="data.item.status === 'PROPOSED' && data.item.owner === account"
                        :to="`/resign/${data.item.address}`"
                        variant="secondary"
                        class="d-inline-block d-lg-none mt-3 mt-lg-0">Resign</b-button>
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
    </div>
</template>

<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'

export default {
    name: 'App',
    data () {
        return {
            chainConfig: {},
            fields: [
                {
                    key: 'index',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'address',
                    label: 'Address',
                    sortable: true
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: true
                },
                {
                    key: 'cap',
                    label: 'Capacity',
                    sortable: true
                },
                {
                    key: 'status',
                    label: 'Status',
                    sortable: false
                },
                {
                    key: 'action-alt',
                    label: '',
                    sortable: false
                },
                {
                    key: 'action',
                    label: '',
                    sortable: false
                }
            ],
            sortBy: 'cap',
            sortDesc: true,
            isReady: !!this.web3,
            account: '',
            voteActive: false,
            voteValue: 1,
            voteItem: {},
            candidates: [],
            currentPage: 1,
            perPage: 10,
            totalRows: 0,
            tableCssClass: '',
            loading: false,
            hasProposed: false,
            hasResigned: false
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
    updated () {},
    created: async function () {
        let self = this
        let config = await self.appConfig()
        self.chainConfig = config.blockchain
        try {
            if (self.isReady) {
                let account = await self.getAccount()
                self.account = account.toLowerCase()
            }

            self.loading = true

            let signers = await axios.get('/api/signers/get/latest')
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate) => {
                let isMasternode = (((signers || {}).data || {}).signers || []).indexOf(candidate.candidate) >= 0
                self.candidates.push({
                    address: candidate.candidate,
                    owner: candidate.owner.toLowerCase(),
                    status: candidate.status,
                    isMasternode: isMasternode,
                    name: candidate.name || 'Anonymous',
                    cap: new BigNumber(candidate.capacity).div(10 ** 18).toNumber()
                })
            })

            self.totalRows = self.candidates.length

            self.loading = false
            self.getTableCssClass()
        } catch (e) {
            self.loading = false
            console.log(e)
        }
    },
    mounted () { },
    methods: {
        watch: async function () {
            let contract = await self.TomoValidator.deployed()
            const allEvents = contract.allEvents({
                fromBlock: self.blockNumber,
                toBlock: 'latest'
            })

            allEvents.watch((err, res) => {
                if (err || !(res || {}).args) {
                    console.error(err, res)
                } else {
                    console.log(res)
                }
            })
        },
        getTableCssClass: function () {
            let cssClass = 'tomo-table--candidates-2-btns'

            if (!this.candidates.length) {
                cssClass += ' tomo-table--candidates-empty'
            }

            for (let candidate of this.candidates) {
                if (candidate.owner === this.account) {
                    if (candidate.status === 'PROPOSED') {
                        this.hasProposed = true
                    }

                    if (candidate.status === 'RESIGNED') {
                        this.hasResigned = true
                    }
                }
            }

            if (this.hasProposed && this.hasResigned) {
                cssClass = 'tomo-table--candidates-3-btns'
            }

            if (!this.hasProposed && this.hasResigned) {
                cssClass = 'tomo-table--candidates-2-btns-withdraw'
            }

            cssClass += this.loading ? ' tomo-table--loading' : ''

            this.tableCssClass = cssClass
        }
    }
}
</script>
