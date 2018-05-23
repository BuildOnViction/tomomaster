<template>
    <div>
        <div
            v-if="isReady"
            class="container status-container md-layout md-gutter md-alignment-top-center">
            <div
                class="md-layout-item md-xlarge-size-25 md-large-size-25
                md-medium-size-50 md-small-size-50 md-xsmall-size-50">
                <md-card md-with-hover>
                    <md-card-header>
                        <p class="md-subheading">Current Block</p>
                        <p class="md-display-1">#{{ blockNumber }}</p>
                    </md-card-header>
                </md-card>
            </div>
            <div
                class="md-layout-item md-xlarge-size-25 md-large-size-25
                md-medium-size-50 md-small-size-50 md-xsmall-size-50">
                <md-card md-with-hover>
                    <md-card-header>
                        <p class="md-subheading">AVG Block Time</p>
                        <p class="md-display-1">2.00 s</p>
                    </md-card-header>
                </md-card>
            </div>
            <div
                class="md-layout-item md-xlarge-size-25 md-large-size-25
                md-medium-size-50 md-small-size-50 md-xsmall-size-50">
                <md-card md-with-hover>
                    <md-card-header>
                        <p class="md-subheading">epoch</p>
                        <p class="md-display-1">990</p>
                    </md-card-header>
                </md-card>
            </div>
            <div
                class="md-layout-item md-xlarge-size-25 md-large-size-25
                md-medium-size-50 md-small-size-50 md-xsmall-size-50">
                <md-card md-with-hover>
                    <md-card-header>
                        <p class="md-subheading">Next Checkpoint</p>
                        <p class="md-display-1">#{{ nextCheckpoint }}</p>
                    </md-card-header>
                </md-card>
            </div>
        </div>
        <div class="container md-layout md-gutter md-alignment-top-center">
            <div class="md-layout-item">
                <md-table
                    v-model="candidates"
                    md-card
                    md-fixed-header
                    md-sort="cap"
                    md-sort-order="asc">
                    <md-table-toolbar>
                        <p class="md-title">Candidates</p>
                    </md-table-toolbar>

                    <md-table-row
                        slot="md-table-row"
                        slot-scope="{ item }">
                        <md-table-cell
                            md-numeric
                            md-label="ID">{{ item.id }}
                        </md-table-cell>
                        <md-table-cell
                            md-label="Address"
                            md-sort-by="address">
                            <router-link :to="'/candidate/' + item.address">{{ item.address }}</router-link>
                        </md-table-cell>
                        <md-table-cell
                            md-label="Capacity"
                            md-sort-by="cap">{{ item.cap }} $TOMO
                        </md-table-cell>
                        <md-table-cell><md-button
                            :to="'/voting/' + item.address"
                            class="md-raised md-primary">Vote</md-button></md-table-cell>
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
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate) => {
                self.candidates.push({
                    address: candidate.candidate,
                    cap: (candidate.capacity / 10 ** 18)
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
<style scoped>
.status-container .md-display-1 {
    margin-top: 0.5em;
    margin-bottom: 0;
}

.status-container .md-card {
    margin-bottom: 0;
}
</style>
