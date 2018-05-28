<template>
    <div>
        <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.0.12/css/all.css"
            integrity="sha384-G0fIWCsCzJIMAVNQPfjH08cyYaUtMwjJwqiRKxxE/rx96Uroj1BtIQ6MLJuheaO9"
            crossorigin="anonymous">
        <div class="container md-layout md-gutter md-alignment-top-center">
            <div
                class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
                <md-card>
                    <md-card-header>
                        <md-content>
                            <div class="md-headline">
                                <span :class="'candidate-status candidate-status--' + candidate.status">
                                    <md-tooltip
                                        class="candidate-status-tooltip"
                                        md-direction="left">{{ candidate.status }}</md-tooltip>
                                </span>
                                {{ candidate.name }}
                            </div>
                            <div class="md-subhead">
                                <a
                                    class="candidate-address"
                                    href="#"
                                    target="__blank">{{ candidate.address }}</a>
                            </div>
                        </md-content>
                    </md-card-header>

                    <md-card-content>
                        <md-content class="social-wrap">
                            <a
                                v-for="(value, key) in candidate.socialInfo"
                                :key="key"
                                :href="value">
                                <md-icon :class="key == 'mail' ? 'fas fa-envelope' : 'fab ' + 'fa-' + key" />
                                {{ key }}
                            </a>
                        </md-content>
                        <md-list class="md-double-line md-list-2-col">
                            <md-list-item :class="'md-list-item-status md-list-item-status--' + candidate.status">
                                <md-icon>offline_bolt</md-icon>
                                <div class="md-list-item-text">
                                    <span>{{ candidate.status }}</span>
                                    <span>Node Status</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon md-src="/app/assets/tomo.svg"/>
                                <div class="md-list-item-text">
                                    <span><strong>{{ candidate.balance }}</strong> $TOMO</span>
                                    <span>Balance</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon md-src="/app/assets/tomo.svg" />
                                <div class="md-list-item-text">
                                    <span><strong>{{ candidate.cap }}</strong> $TOMO</span>
                                    <span>Capacity</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>arrow_upward</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ candidate.totalVoted }}</strong> $TOMO</span>
                                    <span>Total voted</span>
                                </div>
                            </md-list-item>
                            <md-list-item v-if="isReady">
                                <md-icon>receipt</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ candidate.voted }}</strong> $TOMO</span>
                                    <span>You voted</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon>card_giftcard</md-icon>
                                <div class="md-list-item-text">
                                    <span><strong>{{ candidate.rewarded }}</strong> $TOMO</span>
                                    <span>Rewarded</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon class="fa fa-cube" />
                                <div class="md-list-item-text">
                                    <span>#{{ candidate.latestBlock }}</span>
                                    <span>Latest Block</span>
                                </div>
                            </md-list-item>
                            <md-list-item>
                                <md-icon class="fa fa-cubes" />
                                <div class="md-list-item-text">
                                    <span>{{ candidate.totalSignedBlocks }}</span>
                                    <span>Total Signed Blocks</span>
                                </div>
                            </md-list-item>
                        </md-list>
                        <md-card-expand-content class="candidate-expand-content">
                            <md-list class="md-double-line">
                                <md-list-item>
                                    <md-icon class="fa fa-microchip" />
                                    <div class="md-list-item-text">
                                        <span>{{ candidate.hardwareInfo }}</span>
                                        <span>Hardware</span>
                                    </div>
                                </md-list-item>
                                <md-list-item
                                    v-for="(value, key) in candidate.dataCenterInfo"
                                    :key="key">
                                    <md-icon :class="'fa ' + (key == 'name' ? 'fa-server' : 'fa-map-marker-alt')" />
                                    <div class="md-list-item-text">
                                        <span>{{ value }}</span>
                                        <span>{{ key }}</span>
                                    </div>
                                </md-list-item>
                            </md-list>
                        </md-card-expand-content>
                    </md-card-content>

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
            isReady: this.web3,
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
                    mail: '#'
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
                self.candidate.cap = parseFloat(data.capacity) / 10 ** 18
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

<style scoped>

.candidate-status {
    cursor: pointer;
    font-size: 0;
    display: inline-block;
    vertical-align: 4px;
    width: 8px;
    height: 8px;
    border-radius: 100%;
    margin-right: 2px;
}

.candidate-status-tooltip {
    text-transform: capitalize;
}

.candidate-status--active {
    background-color: #60d156;
}

.candidate-status--inactive {
    opacity: .5;
    background-color: #aaaaaa;
}

a.candidate-address.candidate-address {
    color: rgba(0, 0, 0, .87);
}

.social-wrap a {
    font-size: 0;
    margin-right: 5px;
}

.social-wrap a .md-icon {
    font-size: 24px;
}

.md-list-item-status .md-list-item-text {
    text-transform: capitalize;
}

.md-list-item-status.md-list-item-status--active .md-icon {
    color: #60d156;
}

.md-card:not(.md-expand-active) .candidate-expand-content {
    margin-top: -232px !important;
}

.md-list.md-theme-default.md-double-line .md-list-item-text :nth-child(2) {
    text-transform: capitalize;
}
</style>
