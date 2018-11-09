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
                            placeholder="Search..."
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
export default {
    name: 'App',
    data () {
        return {
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
            if (!self.web3 && self.NetworkProvider === 'metamask') {
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

            let regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
            let to = null
            let search = this.search.trim()

            if (regexpAddr.test(search)) {
                return axios.get(`/api/search/${search}`).then((response) => {
                    if (Object.keys(response.data.candidate).length > 0) {
                        to = { path: `/candidate/${search}` }
                    } else {
                        to = { path: `/voter/${search}` }
                    }
                    if (!to) {
                        return false
                    }

                    return this.$router.push(to)
                })
            }
        },
        goPage: function (s) {
            console.log(s)
            this.$router.push({ path: `/candidate/${s}` })
        },
        async checkNetworkAndLogin () {
            try {
                setTimeout(async () => {
                    const contract = await this.TomoValidator.deployed()
                    const account = await this.getAccount()
                    if (account && contract) {
                        this.isTomonet = true
                    }
                }, 0)
            } catch (error) {
                console.log(error)
            }
        }
    }
}
</script>
