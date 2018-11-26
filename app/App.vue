<template>
    <div id="app">
        <div class="page-layout">
            <b-navbar>
                <div class="container">
                    <b-navbar-brand to="/">
                        <img src="/app/assets/img/logo.svg" >
                    </b-navbar-brand>

                    <b-nav-form class="search-form">
                        <b-form-input
                            v-model="search"
                            type="text"
                            placeholder="Search Candidate / Voter address ..."
                            @keyup.enter="searchCandidate"
                        />
                        <b-button
                            variant="outline-success"
                            type="submit"
                            @click="searchCandidate">Search</b-button>
                    </b-nav-form>

                    <div class="navbar-buttons">
                        <b-button
                            v-if="!isTomonet"
                            id="btn-become-candidate"
                            to="/setting"
                            variant="primary">Login</b-button>
                        <b-button
                            v-else
                            id="btn-become-candidate"
                            to="/apply"
                            variant="primary">Become a candidate</b-button>

                        <router-link
                            v-if="isTomonet"
                            id="btn-setting"
                            to="/setting"><i class="tm-dots color-btn-bg"/>Setting</router-link>
                    </div>
                </div>
            </b-navbar>
            <div class="main-content">
                <router-view/>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import store from 'store'
export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            showProgressBar: false,
            selectedCandidate: null,
            search: null,
            isTomonet: false
        }
    },
    async updated () {
        await this.checkNetworkAndLogin()
    },
    created: async function () {
        let self = this

        try {
            if (!self.isReady && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            await self.checkNetworkAndLogin()
        } catch (e) {
            console.log(e)
        }
    },
    methods: {
        searchCandidate (e) {
            e.preventDefault()

            let to = null
            let search = (this.search || '').trim()
            axios.get(`/api/search/${search}`)
                .then((response) => {
                    const data = response.data
                    if (Object.keys(data.candidate).length > 0) {
                        to = { path: `/candidate/${data.candidate.candidate}` }
                    } else if (Object.keys(data.voter).length > 0) {
                        to = { path: `/voter/${search}` }
                    } else {
                        this.$toasted.show('Not found')
                    }
                    if (!to) {
                        return false
                    }
                    this.search = ''
                    return this.$router.push(to)
                }).catch(e => console.log(e))
        },
        goPage: function (s) {
            this.$router.push({ path: `/candidate/${s}` })
        },
        async checkNetworkAndLogin () {
            setTimeout(async () => {
                let account
                try {
                    const contract = await this.TomoValidator.deployed()
                    if (store.get('address')) {
                        account = store.get('address').toLowerCase()
                    } else {
                        account = this.$store.state.walletLoggedIn
                            ? this.$store.state.walletLoggedIn : await self.getAccount()
                    }
                    if (account && contract) {
                        this.isTomonet = true
                    }
                } catch (error) {}
            }, 0)
        }
    }
}
</script>
