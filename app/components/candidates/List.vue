<template>
    <div>
        <div
            v-if="isReady"
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
                            <router-link :to="'/blocksigners'">#{{ blockNumber }}</router-link>
                        </p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">AVG Block Time</h6>
                        <p class="tomo-card__text">2.00 s</p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">epoch</h6>
                        <p class="tomo-card__text">990 blocks</p>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card class="tomo-card tomo-card--animated">
                        <h6 class="tomo-card__title">Next Checkpoint</h6>
                        <p class="tomo-card__text">#{{ nextCheckpoint }}</p>
                    </b-card>
                </div>
            </div>
        </div>
        <div class="container">
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
                :class="'tomo-table tomo-table--candidates ' + getTableCssClass"
                stacked="md" >

                <template
                    slot="index"
                    slot-scope="data">{{ data.item.id }}
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
                    slot-scope="data">{{ formatCurrenctySymbol(formatNumber(data.item.cap)) }}
                </template>

                <template
                    slot="status"
                    slot-scope="data">
                    <div class="mt-2 mt-lg-0">
                        <span
                            v-if="!data.item.isMasternode"
                            :class="'tomo-chip '
                            + (data.item.status === 'PROPOSED' ? 'tomo-chip--primary' : 'tomo-chip--accent') ">
                            {{ data.item.status.toLowerCase() }}
                        </span>
                        <span
                            v-if="data.item.isMasternode"
                            class="tomo-chip tomo-chip--yellow">MASTERNODE</span>
                    </div>
                </template>

                <template
                    v-if="data.item.owner === account"
                    slot="resign"
                    slot-scope="data">
                    <b-button
                        v-if="data.item.status === 'PROPOSED' && data.item.owner === account"
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
                    <b-button
                        v-if="data.item.status === 'RESIGNED' && data.item.owner === account"
                        :to="`/withdraw/${data.item.address}`"
                        variant="secondary"
                        class="mt-3 mt-lg-0">Withdraw</b-button>
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
                    key: 'resign',
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
            blockNumber: 0,
            nextCheckpoint: 0,
            voteActive: false,
            voteValue: 1,
            voteItem: {},
            candidates: [],
            currentPage: 1,
            perPage: 10,
            totalRows: 0
        }
    },
    computed: {
        sortedCandidates: function () {
            return this.candidates.slice().sort(function (a, b) {
                return b.cap - a.cap
            })
        },
        getTableCssClass: function () {
            let cssClass = 'tomo-table--candidates-no-owner'
            for (let candidate of this.candidates) {
                if (candidate.owner === this.account) {
                    cssClass = 'tomo-table--candidates-has-owner'
                    break
                }
            }
            return cssClass
        }
    },
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        try {
            if (self.isReady) {
                let account = await self.getAccount()
                self.account = account
            }

            let signers = await axios.get('/api/signers/get/latest')
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate, idx) => {
                let isMasternode = (((signers || {}).data || {}).signers || []).indexOf(candidate.candidate) >= 0
                self.candidates.push({
                    id: idx + 1,
                    address: candidate.candidate,
                    owner: candidate.owner,
                    status: candidate.status,
                    isMasternode: isMasternode,
                    name: candidate.name || 'Anonymous',
                    cap: (new BigNumber(candidate.capacity)).div(10 ** 18).toString()
                })
            })

            self.totalRows = self.candidates.length

            self.web3.eth.getBlockNumber(function (error, result) {
                if (error) {
                    console.log(error)
                    throw Error('Can not read current block number')
                } else {
                    self.blockNumber = result
                    self.nextCheckpoint = 990 * (Math.floor(self.blockNumber / 990) + 1)
                }
            })
        } catch (e) {
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
        }
    }
}
</script>
