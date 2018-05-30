import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'
import CandidateApply from './components/candidates/Apply.vue'
import CandidateResign from './components/candidates/Resign.vue'
import CandidateWithdraw from './components/candidates/Withdraw.vue'
import VoterView from './components/voters/View'
import VotingView from './components/voters/Voting'
import UnvotingView from './components/voters/Unvoting'
import ConfirmView from './components/voters/Confirm'
import Setting from './components/Setting.vue'

import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import 'vue-material/dist/theme/default.css'
import Web3 from 'web3'
import { default as contract } from 'truffle-contract'
import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json'
Vue.use(VueMaterial)

Vue.prototype.TomoValidator = contract(TomoValidatorArtifacts)
Vue.prototype.isElectron = !!(window && window.process && window.process.type)

if (window.web3) {
    var web3js = new Web3(window.web3.currentProvider)
} else {
    web3js = false
}

Vue.prototype.setupProvider = function (provider, wjs) {
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

let provider = (Vue.prototype.isElectron) ? 'testnet' : 'metamask'
Vue.prototype.setupProvider(provider, web3js)

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
            path: '/withdraw', component: CandidateWithdraw
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

new Vue({ // eslint-disable-line no-new
    el: '#app',
    router: router,
    components: { App },
    template: '<App/>'
})
