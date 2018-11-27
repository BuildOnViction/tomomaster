import Vue from 'vue'
import VueRouter from 'vue-router'
import VueAnalytics from 'vue-analytics'
import App from './App.vue'
import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'
import CandidateApply from './components/candidates/Apply.vue'
import CandidateResign from './components/candidates/Resign.vue'
import CandidateWithdraw from './components/candidates/Withdraw.vue'
import CandidateUpdate from './components/candidates/Update.vue'
import VoterView from './components/voters/View'
import VotingView from './components/voters/Voting'
import UnvotingView from './components/voters/Unvoting'
import ConfirmView from './components/voters/Confirm'
import Setting from './components/Setting.vue'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Web3 from 'web3'
import { default as contract } from 'truffle-contract'
import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json'
import Toasted from 'vue-toasted'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import HighchartsVue from 'highcharts-vue'
import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'
import VueClipboards from 'vue-clipboards'
import Vuex from 'vuex'
import HDWalletProvider from 'truffle-hdwallet-provider'
import localStorage from 'store'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faEdit)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(BootstrapVue)
Vue.use(VueClipboards)

Vue.use(Toasted, {
    position: 'bottom-right',
    theme: 'bubble',
    duration: 4000,
    action : {
        text : 'Dismiss',
        onClick : (e, toastObject) => {
            toastObject.goAway(0)
        }
    }
})

stockInit(Highcharts)
Vue.use(HighchartsVue)

Vue.prototype.TomoValidator = contract(TomoValidatorArtifacts)
Vue.prototype.isElectron = !!(window && window.process && window.process.type)

Vue.prototype.setupProvider = function (provider, wjs) {
    const self = this
    Vue.prototype.NetworkProvider = provider
    if (wjs instanceof Web3) {
        Vue.prototype.web3 = wjs
        Vue.prototype.TomoValidator.setProvider(wjs.currentProvider)
        Vue.prototype.getAccount = function () {
            var p = new Promise(function (resolve, reject) {
                wjs.eth.getAccounts(function (err, accs) {
                    if (err != null) {
                        console.log('There was an error fetching your accounts.')
                        return reject(err)
                    }
                    if (provider === 'tomowallet') {
                        return resolve(self.$store.state.walletLoggedIn)
                    }

                    if (provider === 'rpc') {
                        if (wjs.currentProvider.address) {
                            return resolve(wjs.currentProvider.address)
                        }

                        if (wjs.currentProvider.addresses) {
                            return resolve(wjs.currentProvider.addresses[0])
                        }
                        return resolve('')
                    }
                    if (provider === 'wallet') {
                        return resolve(this.$store.state.walletLoggedIn)
                    }

                    if (accs.length === 0) {
                        console.log(`Couldn't get any accounts! Make sure
                        your Ethereum client is configured correctly.`)
                        return resolve('')
                    }

                    return resolve(accs[0])
                })
            })
            return p
        }
    }
}

Vue.prototype.formatNumber = function (number) {
    let seps = (number || 0).toString().split('.')
    seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return seps.join('.')
}

Vue.prototype.formatCurrencySymbol = function (number) {
    let unit = this.getCurrencySymbol()

    if (unit === null) {
        unit = 'TOMO'
    }
    return `${number} ${unit}`
}

Vue.prototype.getCurrencySymbol = function () {
    return 'TOMO'
}

Vue.prototype.checkLongNumber = function (num) {
    let str = num.toString().split('.')

    return (typeof str[1] !== 'undefined' && str[1].length > 3)
}

Vue.prototype.formatBigNumber = function (num, dp) {
    if (this.checkLongNumber(num)) {
        return new BigNumber(num).toFormat(dp)
    }

    return this.formatNumber(num)
}

const getConfig = Vue.prototype.appConfig = async function () {
    let config = await axios.get('/api/config')
    return config.data
}

Vue.prototype.getSecondsToHms = function (number) {
    number = parseInt(number, 10)
    if (number < 0) {
        return 'Available to withdraw'
    }

    number = number * 2

    let h = Math.floor(number / 3600)
    let m = Math.floor(number % 3600 / 60)
    let s = Math.floor(number % 3600 % 60)

    if (h < 10) { h = '0' + h }
    if (m < 10) { m = '0' + m }
    if (s < 10) { s = '0' + s }

    return `${h}:${m}:${s}`
}

Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/', component: CandidateList
        },
        {
            path: '/apply', component: CandidateApply
        },
        {
            path: '/resign', component: CandidateResign
        },
        {
            path: '/resign/:address', component: CandidateResign
        },
        {
            path: '/withdraw', component: CandidateWithdraw, name: 'CandidateWithdraw'
        },
        {
            path: '/withdraw/:address', component: CandidateWithdraw
        },
        {
            path: '/candidates', component: CandidateList
        },
        {
            path: '/candidate/:address', component: CandidateView
        },
        {
            path: '/candidate/:address/update', component: CandidateUpdate
        },
        {
            path: '/voter/:address', component: VoterView
        },
        {
            path: '/voting/:candidate', component: VotingView
        },
        {
            path: '/unvoting/:candidate', component: UnvotingView
        },
        {
            path: '/confirm/:transaction', component: ConfirmView
        },
        {
            path: '/setting', component: Setting
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const provider = Vue.prototype.NetworkProvider || localStorage.get('network') || null
    await Vue.prototype.detectNetwork(provider)
    next()
})

getConfig().then((config) => {
    // let provider = 'tomowallet'
    // var web3js = new Web3(new Web3.providers.HttpProvider(config.blockchain.rpc))
    // Vue.prototype.setupProvider(provider, web3js)

    Vue.use(VueAnalytics, {
        id: config.GA,
        router,
        autoTraking: {
            screenView: true
        }
    })
}).catch(e => {
    console.log(e)
    throw e
})

Vue.use(Vuex)

const store = new Vuex.Store({
    state: {
        walletLoggedIn: null
    }
})
Vue.prototype.detectNetwork = async function (provider) {
    try {
        let wjs = false
        const config = await getConfig()
        const chainConfig = config.blockchain
        switch (provider) {
        case 'metamask':
            if (window.web3) {
                var p = window.web3.currentProvider
                wjs = new Web3(p)
            }
            break
        case 'tomowallet':
            wjs = new Web3(new HDWalletProvider(
                '',
                chainConfig.rpc, 0, 1, true, "m/44'/889'/0'/0/"))
            break
        default:
            break
        }
        await this.setupProvider(provider, await wjs)
    } catch (error) {
        console.log(error)
    }
}

new Vue({ // eslint-disable-line no-new
    el: '#app',
    store,
    router: router,
    components: { App },
    template: '<App/>'
})
