import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'

import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';
import { default as contract } from 'truffle-contract';
import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json';
Vue.use(VueMaterial)

var web3 = window.web3 || false;
Vue.prototype.web3 = web3;
Vue.prototype.TomoValidator = contract(TomoValidatorArtifacts);
Vue.prototype.TomoValidator.setProvider(Vue.prototype.web3.currentProvider);
Vue.prototype.getAccount = function() {
    var p = new Promise(function(resolve, reject) {
        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                console.log("There was an error fetching your accounts.");
                reject(err);
            }

            if (accs.length == 0) {
                console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                reject(err);
            }

            resolve(accs[0]);
        });
    });
    return p;
}

Vue.use(VueRouter);

const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/', component: CandidateList
        },
        {
            path: '/candidates', component: CandidateList
        },
        {
            path: '/candidates/:address', component: CandidateView
        }
    ]
});

new Vue({
    el: '#app',
    router: router,
    template: '<App/>',
    components: { App }
})
