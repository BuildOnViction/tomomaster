<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center">
            <div class="col-12">
                <h3 class="section-title">
                    <i class="tm-signer color-yellow" />
                    <span>Block Signers</span>
                </h3>
            </div>
            <b-table
                :items="blockSigners"
                :fields="fields"
                :current-page="currentPage"
                :per-page="perPage"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :show-empty="true"
                :class="`col-12 tomo-table tomo-table--signers${loading ? ' loading' : ''}`"
                empty-text="There are no signers to show"
                stacked="md" >

                <template
                    slot="index"
                    slot-scope="data">{{ data.item.blockNumber }}
                </template>

                <template
                    slot="signers"
                    slot-scope="data">
                    <ul>
                        <li
                            v-for="it in data.item.signers"
                            :key="it._id">
                            <router-link
                                :to="'/candidate/' + it.signer"
                                class="text-truncate">
                                {{ it.signer }}
                            </router-link>
                        </li>
                    </ul>
                </template>
            </b-table>

            <b-pagination
                v-if="totalRows > 0 && totalRows > perPage"
                :total-rows="totalRows"
                :per-page="perPage"
                v-model="currentPage"
                align="center"
                class="tomo-pagination" />
        </b-row>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'App',
    data () {
        return {
            fields: [
                {
                    key: 'blockNumber',
                    label: 'Block Number',
                    sortable: false
                },
                {
                    key: 'signers',
                    label: 'Signers',
                    sortable: false
                }
            ],
            sortBy: 'signers',
            sortDesc: true,
            isReady: !!this.web3,
            account: '',
            blockSigners: [],
            currentPage: 1,
            perPage: 5,
            totalRows: 0,
            loading: false
        }
    },
    computed: {
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

            self.loading = true

            let signers = await axios.get('/api/blocksigners/list')
            self.blockSigners = signers.data
            self.totalRows = self.blockSigners.length
            self.loading = false
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {
    },
    methods: {
    }
}
</script>
