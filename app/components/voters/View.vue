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
        <div class="container section section--candiates mt-5">
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
    </div>
</template>
<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'

export default {
    name: 'App',
    data () {
        return {
            candidateFields: [
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
                    key: 'cap',
                    label: 'Capacity',
                    sortable: true
                }
            ],
            sortBy: 'cap',
            sortDesc: true,
            isReady: !!this.web3,
            voter: this.$route.params.address,
            candidates: [],
            balance: 0,
            totalVoted: 0,
            currentPage: 1,
            perPage: 10,
            totalRows: 0,
            loading: false
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
    update () {},
    created: async function () {
        let self = this
        try {
            let voter = self.$route.params.address

            self.loading = true
            let candidates = await axios.get(`/api/voters/${voter}/candidates`)

            candidates.data.map(async (c) => {
                self.candidates.push({
                    address: c.candidate,
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

            self.loading = false
        } catch (e) {
            self.loading = false
            console.log(e)
        }
    }
}
</script>
