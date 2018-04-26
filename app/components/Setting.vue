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
                        <md-select v-model="provider" name="provider" id="provider">
                            <md-option value="metamask">Metamask</md-option>
                            <md-option value="mainnet">TomoChain Mainnet</md-option>
                            <md-option value="testnet">Tomochain Testnet</md-option>
                        </md-select>
                    </md-field>
                    <md-field v-if="provider !== 'metamask'">
                        <label>MNEMONIC</label>
                        <md-input v-model="mnemonic"></md-input>
                    </md-field>
                </div>
            </div>
            </md-card-content>

            <md-card-actions>
                <md-button class="md-primary md-raised" @click="save()">Save</md-button>
            </md-card-actions>
        </md-card>
    </div>
</template>
<script>
import Web3 from 'web3';
const HDWalletProvider = require('truffle-hdwallet-provider');
const networks = {
    mainnet: 'https://core.tomocoin.io',
    testnet: 'https://core.tomocoin.io'
}
export default {
    name: 'app',
    data() {
        return {
            mnemonic: '',
            provider: 'metamask'
        };
    },
    computed: {},
    watch: {},
    updated() {},
    created() {
        this.provider = this.NetworkProvider;
    },
    mounted() {},
    methods: {
        save: function() {
            const vm = this;
            if (this.provider === 'metamask') {
                var web3js = new Web3(web3.currentProvider);
            } else {
                const walletProvider = new HDWalletProvider(this.mnemonic, networks[this.provider]);
                var web3js = new Web3(walletProvider);
            } 
            vm.NetworProvider = this.provider;
            vm.setupProvider(web3js);
            vm.$router.push({path: '/'});
        }
    }
};
</script>
<style>
.setting-container {
    padding-top: 40px;
}
</style>
