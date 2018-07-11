<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-table
                :items="blockSigners"
                :fields="fields"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                show-empty="true"
                empty-text="There are no signers to show"
                class="tomo-table tomo-table--signers"
                stacked="md" >

                <template
                    slot="index"
                    slot-scope="data">{{ data.blockNumber }}
                </template>

                <template
                    slot="signers"
                    slot-scope="data">
                    <router-link
                        v-for="it in data.signers"
                        :key="it"
                        :to="'/candidate/' + it">
                        {{ it }}
                    </router-link>
                </template>
            </b-table>
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
                    key: 'index',
                    label: 'ID',
                    sortable: false
                },
                {
                    key: 'signers',
                    label: 'Signer',
                    sortable: false
                }
            ],
            sortBy: 'signers',
            sortDesc: true,
            isReady: !!this.web3,
            account: '',
            blockSigners: []
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

            let signers = await axios.get('/api/blocksigners/list')
            self.blockSigners = signers.data
        } catch (e) {
            console.log(e)
        }
    },
    mounted () { },
    methods: {
    }
}
</script>
