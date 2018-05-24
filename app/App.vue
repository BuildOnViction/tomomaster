<template>
    <div id="app">
        <div class="page-layout">
            <md-toolbar class="md-primary">
                <div class="md-toolbar-row">
                    <div class="md-toolbar-section-start"><router-link to="/">
                        <h3
                            class="md-title"
                            style="flex: 1">TomoChain Governance</h3></router-link>
                    </div>

                    <md-autocomplete
                        v-model="selectedCandidate"
                        :md-options="candidates"
                        class="search"
                        md-layout="box"
                        @md-selected="goPage">
                        <label>Search &hellip;</label>

                        <template
                            slot="md-autocomplete-item"
                            slot-scope="{ item, term }">
                            <md-highlight-text :md-term="term">{{ item }}</md-highlight-text>
                        </template>

                        <template
                            slot="md-autocomplete-empty"
                            slot-scope="{ term }">
                            No candidates matching "{{ term }}" were found
                        </template>
                    </md-autocomplete>
                    <div class="md-toolbar-section-end">
                        <md-button
                            v-if="!isCandidate"
                            class="md-raised"
                            to="/apply">
                            Become a candidate
                        </md-button>

                        <md-menu
                            md-direction="bottom-start"
                            md-align-trigger>
                            <md-button
                                class="md-icon-button"
                                md-menu-trigger>
                                <md-icon>more_vert</md-icon>
                            </md-button>

                            <md-menu-content>
                                <md-menu-item v-if="isCandidate">
                                    <md-button
                                        to="/retire"
                                        class="md-accent">
                                        <md-icon>arrow_downward</md-icon> Retire
                                    </md-button>
                                </md-menu-item>
                                <md-menu-item>
                                    <md-button
                                        to="/withdraw"
                                        class="md-accent">
                                        <md-icon>arrow_back</md-icon> Withdraw
                                    </md-button>
                                </md-menu-item>
                                <md-menu-item>
                                    <md-button
                                        to="/setting"
                                        class="md-primary">
                                        <md-icon>settings</md-icon> Settings
                                    </md-button>
                                </md-menu-item>
                            </md-menu-content>
                        </md-menu>
                    </div>
                </div>
            </md-toolbar>
            <md-progress-bar
                v-if="showProgressBar"
                class="md-accent"
                md-mode="indeterminate"/>
            <div class="main-content">
                <router-view/>
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
            showProgressBar: false,
            selectedCandidate: null,
            candidates: [],
            isCandidate: false
        }
    },
    created: async function () {
        let self = this

        try {
            if (typeof self.web3 === 'undefined' && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate) => {
                self.candidates.push(candidate.candidate)
            })
            let account = await self.getAccount()
            let contract = await self.TomoValidator.deployed()
            self.isCandidate = await contract.isCandidate(account, { from: account })
        } catch (e) {
            console.log(e)
        }
    },
    methods: {
        goPage: function (s) {
            console.log(s)
            this.$router.push({ path: `/candidate/${s}` })
        }
    }
}
</script>
<style>
.main-content {
    width: 1170px;
    margin: 0 auto;
}

.container {
    padding-top: 40px;
}

.search {
    max-width: 500px;
}

.md-card {
    margin-bottom: 30px;
}

.md-table-fixed-header + .md-table-content {
    height: auto !important;
}

</style>
