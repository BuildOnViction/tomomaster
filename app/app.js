import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'
import CandidateApply from './components/candidates/Apply.vue'
import CandidateRetire from './components/candidates/Retire.vue'
import VoterView from './components/voters/View'
import VotingView from './components/voters/Voting'
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
                        reject(err)
                    }

                    if (accs.length === 0) {
                        console.log(`Couldn't get any accounts! Make sure
                        your Ethereum client is configured correctly.`)
                        reject(err)
                    }

                    resolve(accs[0])
                })
            })
            return p
        }
    }
}
Vue.prototype.setupProvider('metamask', web3js)

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
            path: '/retire', component: CandidateRetire
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
            path: '/confirm', component: ConfirmView
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
