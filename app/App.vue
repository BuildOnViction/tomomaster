<template>
    <div id="app">
        <div class="page-layout">
            <b-navbar>
                <div class="container">
                    <b-navbar-brand to="/">
                        <img src="/app/assets/img/logo.svg" >
                    </b-navbar-brand>

                    <b-nav-form class="search-form">
                        <b-form-input placeholder="Search..." />
                        <b-button
                            variant="outline-success"
                            type="submit">Search</b-button>
                    </b-nav-form>

                    <div class="navbar-buttons">
                        <b-button
                            id="btn-become-candidate"
                            to="/apply"
                            variant="primary">Become a candidate</b-button>

                        <router-link
                            id="btn-setting"
                            to="/setting"><i class="tm-cog color-purple"/>Setting</router-link>
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
            candidates: []
        }
    },
    created: async function () {
        let self = this

        try {
            if (!self.web3 && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            let candidates = await axios.get('/api/candidates')
            candidates.data.map(async (candidate) => {
                self.candidates.push(candidate.candidate)
            })
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
