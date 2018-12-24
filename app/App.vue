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
                            autocomplete="false"
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
                            to="/setting">
                            <font-awesome-icon
                                :icon="{ prefix: 'fas', iconName: 'user-circle' }"
                                class="fa-2x ml-1"
                                style="color: #678be0" />
                        </router-link>

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
                class="tomo-footer mt-2">
                <div class="container">
                    <div
                        class="row">
                        <b-col class="float-left">
                            <p>
                                TomoMaster {{ (new Date()).getFullYear() }} -
                                <a
                                    :href="`https://github.com/tomochain/tomomaster/releases/tag/v${version}`">
                                    v{{ version }}</a>
                            </p>
                        </b-col>
                        <b-col>
                            <div
                                style="text-align: center">
                                <ul class="list-inline tomo-footer__social">
                                    <li class="list-inline-item">
                                        <a
                                            href="https://t.me/tomochain"
                                            target="_blank">
                                            <font-awesome-icon
                                                id="telegram"
                                                :icon="{ prefix: 'fab', iconName: 'telegram' }"
                                                class="fa-2x"/>
                                        </a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            href="https://www.facebook.com/tomochainofficial"
                                            target="_blank">
                                            <font-awesome-icon
                                                :icon="{ prefix: 'fab', iconName: 'facebook' }"
                                                class="fa-2x"/>
                                        </a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            href="https://twitter.com/TomoChainANN"
                                            target="_blank">
                                            <font-awesome-icon
                                                :icon="{ prefix: 'fab', iconName: 'twitter' }"
                                                class="fa-2x"/>
                                        </a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            href="https://github.com/tomochain/"
                                            target="_blank">
                                            <font-awesome-icon
                                                :icon="{ prefix: 'fab', iconName: 'github' }"
                                                class="fa-2x"/>
                                        </a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            href="https://www.reddit.com/r/Tomochain/"
                                            target="_blank">
                                            <font-awesome-icon
                                                :icon="{ prefix: 'fab', iconName: 'reddit' }"
                                                class="fa-2x"/>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </b-col>
                        <b-col>
                            <div
                                class="float-right footer-right">
                                <a
                                    target="_blank"
                                    href="https://bit.ly/2B6p29o">
                                    <font-awesome-icon
                                        id="question-circle"
                                        :icon="{ prefix: 'fas', iconName: 'question-circle' }"
                                        style="font-size: 15px"
                                        class="mr-1"/>
                                    Need help?</a>
                                <a
                                    target="_blank"
                                    href="/privacyPolicy"><i class="tm-lock mr-2"/>Privacy Policy</a>
                                <a
                                    target="_blank"
                                    href="/terms"><i class="tm-profile mr-2"/>Terms of Service</a>
                            </div>
                        </b-col>
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
