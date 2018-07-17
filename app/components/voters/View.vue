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
                    <p class="tomo-info__description">
                        {{ formatCurrencySymbol(formatNumber(balance)) }}
                    </p>
                </div>
                <div class="col-12 tomo-info">
                    <p class="tomo-info__title">
                        <i class="tm-dot tomo-info__icon" />
                        <span class="tomo-info__text">Total voted</span>
                    </p>
                    <p class="tomo-info__description">
                        {{ formatCurrencySymbol(formatNumber(totalVoted)) }}
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
                :fields="fields"
                :current-page="currentPage"
                :per-page="perPage"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :show-empty="true"
                class="tomo-table tomo-table--voted"
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
            fields: [
                {
                    key: 'index',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'address',
                    label: 'Candidate',
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
            totalRows: 0
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
            let candidates = await axios.get(`/api/voters/${voter}/candidates`)

            candidates.data.map(async (c) => {
                self.candidates.push({
                    address: c.candidate,
                    cap: (new BigNumber(c.capacity)).div(10 ** 18).toString()
                })
                self.totalVoted += c.capacity / 10 ** 18
            })

            self.totalRows = self.candidates.length

            if (typeof self.web3 !== 'undefined') {
                self.web3.eth.getBalance(voter, function (a, b) {
                    self.balance = b / 10 ** 18
                    if (a) {
                        throw Error(a)
                    }
                })
            }
        } catch (e) {
            console.log(e)
        }
    }
}
</script>
