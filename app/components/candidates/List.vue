<template>
    <div>
        <div
            v-if="isReady"
            class="container status-container">
            <div class="row">
                <div class="col-md-6 col-lg-3">
                    <b-card>
                        <h6>Current Block</h6>
                        <h3><router-link :to="'/blocksigners'">#{{ blockNumber }}</router-link></h3>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card>
                        <h6>AVG Block Time</h6>
                        <h3>2.00 s</h3>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card>
                        <h6>epoch</h6>
                        <h3>990 blocks</h3>
                    </b-card>
                </div>
                <div class="col-md-6 col-lg-3">
                    <b-card>
                        <h6>Next Checkpoint</h6>
                        <h3>#{{ nextCheckpoint }}</h3>
                    </b-card>
                </div>
            </div>
        </div>
        <div class="container">
            <b-table
                :items="candidates"
                :fields="fields"
                responsive >

                <template
                    slot="index"
                    slot-scope="data">{{ data.index + 1 }}
                </template>

                <template
                    slot="address"
                    slot-scope="data">
                    <router-link :to="'/candidate/' + data.item.address">
                        {{ data.item.address }}
                    </router-link>
                </template>

                <template
                    slot="cap"
                    slot-scope="data">{{ formatCurrenctySymbol(data.item.cap) }}</template>

                <template
                    slot="status"
                    slot-scope="data">
                    <span
                        v-if="!data.item.isMasternode"
                        :class="'tomo-chip '
                        + (data.item.status === 'PROPOSED' ? 'tomo-chip--primary' : 'tomo-chip--accent') ">
                        {{ data.item.status }}
                    </span>
                    <span v-if="data.item.isMasternode">MASTERNODE</span>
                </template>

                <template
                    slot="action"
                    slot-scope="data">
                    <b-button
                        v-if="data.item.status === 'PROPOSED'"
                        :to="`/voting/${data.item.address}`">Vote</b-button>
                    <b-button
                        v-if="data.item.status === 'PROPOSED' && data.item.owner === account"
                        :to="`/resign/${data.item.address}`">Resign</b-button>
                    <b-button
                        v-if="data.item.status === 'RESIGNED' && data.item.owner === account"
                        :to="`/withdraw/${data.item.address}`">Withdraw</b-button>
                </template>
            </b-table>
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
                    label: 'ID'
                },
                {
                    key: 'address',
                    label: 'Address'
                },
                {
                    key: 'name',
                    label: 'Name'
                },
                {
                    key: 'cap',
                    label: 'Capacity'
                },
                {
                    key: 'status',
                    label: 'Status'
                },
                {
                    key: 'action',
                    label: ''
                }
            ],
            isReady: !!this.web3,
            account: '',
            blockNumber: 0,
            nextCheckpoint: 0,
            voteActive: false,
            voteValue: 1,
            voteItem: {},
            candidates: []
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
        try {
            if (self.isReady) {
                let account = await self.getAccount()
                self.account = account
            }

            let signers = await axios.get('/api/signers/get/latest')
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate) => {
                let isMasternode = (((signers || {}).data || {}).signers || []).indexOf(candidate.candidate) >= 0
                self.candidates.push({
                    address: candidate.candidate,
                    owner: candidate.owner,
                    status: candidate.status,
                    isMasternode: isMasternode,
                    name: candidate.name || 'Anonymous',
                    cap: self.formatNumber((new BigNumber(candidate.capacity)).div(10 ** 18).toString())
                })
            })
            self.candidates.sort((a, b) => {
                return b.cap - a.cap
            }).map((c, i) => {
                c.id = i + 1
            })

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
