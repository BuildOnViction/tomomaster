<template>
    <div>
        <div class="table-container">
            <md-table
                v-model="candidates"
                md-card
                md-fixed-header
                md-sort="cap"
                md-sort-order="asc">
                <md-table-toolbar>
                    <div class="md-title">Candidates</div>
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
</template>
<script>

import axios from 'axios'
export default {
    name: 'App',
    data () {
        return {
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
        } catch (e) {
            self.isNotReady = true
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {}
}
</script>
