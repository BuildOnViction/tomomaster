import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'

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
