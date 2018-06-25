<template>
    <div>
        <div class="container md-layout md-gutter md-alignment-top-center">
            <div class="md-layout-item">
                <md-table
                    v-model="blockSigners"
                    md-card
                    md-fixed-header>
                    <md-table-toolbar>
                        <p class="md-title">Blocks</p>
                    </md-table-toolbar>

                    <md-table-row
                        slot="md-table-row"
                        slot-scope="{ item }">
                        <md-table-cell
                            md-numeric
                            md-label="ID">{{ item.blockNumber }}
                        </md-table-cell>
                        <md-table-cell
                            md-label="Signer">
                            <router-link
                                v-for="it in item.signers"
                                :key="it"
                                :to="'/candidate/' + it">
                                {{ it }}
                            </router-link>
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
<style scoped>
.status-container .md-display-1 {
    margin-top: 0.5em;
    margin-bottom: 0;
}

.status-container .md-card {
    margin-bottom: 0;
}
</style>
