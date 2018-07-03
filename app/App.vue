<template>
    <div id="app">
        <div class="page-layout">
            <b-navbar>
                <div class="container">
                    <b-navbar-brand href="#">TOMOMASTER</b-navbar-brand>

                    <b-nav-form>
                        <b-form-input placeholder="Search..." />
                        <b-button type="submit">Search</b-button>
                    </b-nav-form>

                    <b-button to="/apply">Become a candidate</b-button>
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
