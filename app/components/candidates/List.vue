<template>
    <div>
        <md-empty-state
            v-if="isNotReady"
            md-icon="account_balance_wallet"
            md-label="MetaMask is not installed"
            md-description="Please install &amp; login
            Metamask Extension then connect it to Tomochain Mainnet or Testnet">
            <md-button
                class="md-primary md-raised"
                href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
                target="_blank">Install Metamask</md-button>
        </md-empty-state>
        <div
            v-if="!isNotReady"
            class="table-container">
            <md-table md-card>
                <md-table-toolbar>
                    <div class="md-title">Candidates</div>
                </md-table-toolbar>

                <md-table-row>
                    <md-table-head md-numeric>ID</md-table-head>
                    <md-table-head>Address</md-table-head>
                    <md-table-head>Capacity</md-table-head>
                    <md-table-head/>
                </md-table-row>

                <md-table-row
                    v-for="(c, key) in candidates"
                    :key="key">
                    <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                    <md-table-cell>
                        <router-link :to="'/candidates/' + c.address">{{ c.address }}</router-link>
                    </md-table-cell>
                    <md-table-cell>{{ c.cap }} $TOMO</md-table-cell>
                    <md-table-cell><md-button
                        class="md-raised md-primary"
                        @click="voteActive = true; voteItem = c">Vote</md-button></md-table-cell>
                </md-table-row>
            </md-table>
        </div>
        <md-dialog-prompt
            :md-active.sync="voteActive"
            v-model="voteValue"
            md-title="How much?"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm"
            @md-confirm="vote()"/>
    </div>
</template>
<script>

export default {
    name: 'App',
    data () {
        return {
            isNotReady: !this.web3,
            voteActive: false,
            voteValue: 1,
            voteItem: {},
            candidates: []
        }
    },
    computed: { },
    watch: {},
    updated () {},
    created () {
        var vm = this
        vm.getAccount().then(account => {
            return vm.TomoValidator.deployed().then(function (tv) {
                return tv.getCandidates.call({ from: account }).then(cs => {
                    var map = cs.map(it => {
                        return tv.getCandidateCap.call(it, { from: account }).then(d => {
                            vm.candidates.push({
                                address: it, cap: String(d / 10 ** 18)
                            })
                        })
                    })
                    return Promise.all(map)
                })
            })
        }).catch(e => {
            this.isNotReady = true
        })
    },
    mounted () {
    },
    methods: {
        vote: function () {
            var vm = this
            var candidate = this.voteItem
            var value = this.voteValue
            vm.getAccount().then(account => {
                return vm.TomoValidator.deployed().then(function (tv) {
                    return tv.vote(candidate.address, {
                        from: account, value: parseFloat(value) * 10 ** 18
                    }).then((d) => {
                        return tv.getCandidateCap.call(candidate.address, { from: account }).then(d => {
                            candidate.cap = String(d / 10 ** 18) + ' $TOMO'
                        })
                    })
                })
            }).catch(e => console.log(e))
        }
    }
}
</script>
