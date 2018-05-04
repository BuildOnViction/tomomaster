<template>
    <div class="setting-container">
        <md-card>
            <md-card-header>
                <div class="md-title">Settings</div>
            </md-card-header>

            <md-card-content>
                <div>
                    <div class="md-layout-item">
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
                            v-if="isNotReady && provider === 'metamask'">
                            <p>Please install &amp; login
                            Metamask Extension then connect it to Tomochain Mainnet or Testnet.</p>
                        </div>

                    </div>

                </div>
            </md-card-content>

            <md-card-actions>
                <md-button
                    class="md-primary md-raised"
                    @click="save()">Save</md-button>
            </md-card-actions>
            <md-card-header>
                <div class="md-title">Account Information</div>
            </md-card-header>

            <md-card-content>
                <p>Address: {{ address }}</p>
                <p>Balance: {{ balance }} $TOMO</p>
            </md-card-content>

        </md-card>
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
            isNotReady: !this.web3,
            mnemonic: '',
            provider: 'metamask',
            address: '',
            balance: 0
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created () {
        this.provider = this.NetworkProvider
        var vm = this
        this.getAccount().then(acc => {
            vm.address = acc
            vm.web3.eth.getBalance(vm.address, function (a, b) {
                vm.balance = b / 10 ** 18
                if (a) console.log('got an error', a)
            })
        }).catch(e => {
            this.isNotReady = true
        })
    },
    mounted () {},
    methods: {
        save: function () {
            const vm = this
            var wjs = false
            if (this.provider === 'metamask') {
                if (window.web3) {
                    var p = window.web3.currentProvider
                    wjs = new Web3(p)
                }
            } else {
                const walletProvider = new HDWalletProvider(this.mnemonic, networks[this.provider])
                wjs = new Web3(walletProvider)
            }
            vm.setupProvider(this.provider, wjs)
            vm.$router.push({ path: '/' })
        }
    }
}
</script>
<style>
.setting-container {
    padding-top: 40px;
}
</style>
