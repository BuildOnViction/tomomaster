<template>
    <div class="setting-container md-layout md-gutter md-alignment-top-center">
        <div
            class="md-layout-item md-xlarge-size-50 md-large-size-50
                md-medium-size-70 md-small-size-90 md-xsmall-size-90">
            <md-card>
                <md-card-header>
                    <p class="md-title">Settings</p>
                </md-card-header>

                <md-card-content>
                    <md-field>
                        <label for="provider">Network Providers</label>
                        <md-select
                            id="provider"
                            v-model="provider"
                            name="provider">
                            <md-option value="metamask">Metamask</md-option>
                            <md-option value="mainnet">TomoChain Mainnet</md-option>
                            <md-option value="testnet">Tomochain Testnet</md-option>
                        </md-select>
                    </md-field>
                    <md-field v-if="provider !== 'metamask'">
                        <label>MNEMONIC</label>
                        <md-input v-model="mnemonic"/>
                    </md-field>
                    <div
                        v-if="!isReady && provider === 'metamask'">
                        <p>Please install &amp; login
                            <a
                                href="http://bitly.com/2gmvrGG"
                                target="_blank">Metamask Extension</a>
                            then connect it to Tomochain Mainnet or Testnet.</p>
                    </div>
                </md-card-content>

                <md-card-actions>
                    <md-button
                        class="md-primary md-raised"
                        @click="save()">Save</md-button>
                </md-card-actions>
                <md-card-header v-if="isReady">
                    <p class="md-title">Account Information</p>
                </md-card-header>

                <md-card-content v-if="isReady">
                    <p>Address: {{ address }}</p>
                    <p>Balance: <strong>{{ balance }}</strong> $TOMO</p>
                </md-card-content>
            </md-card>
        </div>
    </div>
</template>
<script>
import Web3 from 'web3'
const HDWalletProvider = require('truffle-hdwallet-provider')
const networks = {
    mainnet: 'https://core.tomocoin.io',
    testnet: 'https://core.tomocoin.io'
}
export default {
    name: 'App',
    data () {
        return {
            isReady: this.web3,
            mnemonic: '',
            provider: 'metamask',
            address: '',
            balance: 0
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: async function () {
        this.provider = this.NetworkProvider
        let self = this

        try {
            if (typeof self.web3 === 'undefined' && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            let account = await self.getAccount()
            self.address = account
            self.web3.eth.getBalance(self.address, function (a, b) {
                self.balance = b / 10 ** 18
                if (a) {
                    console.log('got an error', a)
                }
            })
        } catch (e) {
            console.log(e)
        }
    },
    mounted () {},
    methods: {
        save: function () {
            const self = this
            var wjs = false
            if (self.provider === 'metamask') {
                if (window.web3) {
                    var p = window.web3.currentProvider
                    wjs = new Web3(p)
                }
            } else {
                const walletProvider = new HDWalletProvider(self.mnemonic, networks[self.provider])
                wjs = new Web3(walletProvider)
            }
            self.setupProvider(this.provider, wjs)
            self.$router.push({ path: '/' })
        }
    }
}
</script>
<style scoped>
.setting-container {
    padding-top: 40px;
}
</style>
