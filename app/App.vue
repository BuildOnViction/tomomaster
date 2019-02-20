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
                            autocomplete="off"
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

                        <!-- <router-link
                            v-if="isTomonet"
                            id="btn-setting"
                            to="/setting">
                            <i class="tm-cog ml-1 icon-2x" />
                        </router-link> -->

                        <b-dropdown
                            id="ddown-dropup"
                            class="dd-setting"
                            no-caret="true"
                            variant="primary">
                            <template
                                slot="button-content">
                                <i class="tm-cog ml-1 icon-2x" />
                            </template>
                            <b-dropdown-item href="#">Action</b-dropdown-item>
                            <b-dropdown-item href="#">Another action</b-dropdown-item>
                            <b-dropdown-item href="#">Something else here</b-dropdown-item>
                        </b-dropdown>

                        <!-- <router-link
                        v-if="isTomonet"
                        id="btn-setting"
                        to="/setting">
                        <i class="tm-dots color-btn-bg"/>Setting</router-link> -->
                    </div>
                </div>
            </b-navbar>
            <div class="main-content">
                <router-view/>
            </div>
            <footer
                class="tomo-footer">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="tomo-footer__copyright">
                                TomoMaster &copy; {{ (new Date()).getFullYear() }} -
                                <a
                                    :href="`https://github.com/tomochain/tomomaster/releases/tag/v${version}`"
                                    class="version-tag">
                                    v{{ version }}</a>
                            </div>
                            <div class="tomo-footer__links">
                                <ul class="list-inline">
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="https://bit.ly/2B6p29o"><i class="tm-lifebuoy mr-1"/>Need help?</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/privacyPolicy"><i class="tm-lock mr-1"/>Privacy Policy</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/terms"><i class="tm-profile mr-1"/>Terms of Service</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/apidocs"><i class="tm-checklist mr-1"/>API Documentation</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-md-4 tomo-footer__social">
                            <ul class="list-inline">
                                <li class="list-inline-item">
                                    <a
                                        href="https://t.me/tomochain"
                                        target="_blank">
                                        <i class="tm-telegram" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.facebook.com/tomochainofficial"
                                        target="_blank">
                                        <i class="tm-facebook" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://twitter.com/TomoChainANN"
                                        target="_blank">
                                        <i class="tm-twitter" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://github.com/tomochain/"
                                        target="_blank">
                                        <i class="tm-github" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.reddit.com/r/Tomochain/"
                                        target="_blank">
                                        <i class="tm-reddit" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import store from 'store'
import pkg from '../package.json'
export default {
    name: 'App',
    data () {
        return {
            isReady: !!this.web3,
            showProgressBar: false,
            selectedCandidate: null,
            search: null,
            isTomonet: false,
            version: pkg.version
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
            self.$bus.$on('logged', async () => {
                await self.checkNetworkAndLogin()
            })
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
            let self = this
            setTimeout(async () => {
                let account
                try {
                    const contract = await self.getTomoValidatorInstance()
                    if (store.get('address')) {
                        account = store.get('address').toLowerCase()
                    } else {
                        account = this.$store.state.walletLoggedIn
                            ? this.$store.state.walletLoggedIn : await self.getAccount()
                    }
                    if (account && contract) {
                        self.isTomonet = true
                    }
                } catch (error) {}
            }, 0)
        }
    }
}
</script>
