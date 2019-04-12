<template>
    <div class="container">
        <b-row
            align-v="center"
            align-h="center"
            class="m-0">
            <b-card
                class="col-12 col-md-8 col-lg-6 tomo-card tomo-card--animated p-0">
                <h4 class=" color-white tomo-card__title tomo-card__title--big">
                    <i :class="`tm-${icon}`"/>
                    {{ title }}
                </h4>
                <p class="md-content">
                    You have {{ event }}
                    <span class="color-white">{{ amount }} TOMO</span> for candidate
                    <router-link :to="`/candidate/${candidate}`">
                    {{ truncate(candidate, 20) }}</router-link> successfully.
                    <br ><br >
                    Transaction Hash:
                    <a
                        :href="txUrl"
                        target="_blank">{{ truncate(tx, 30) }}</a>
                </p>
                <p
                    class="md-content"
                    v-html="description"/>

                <div class="buttons text-right">
                    <b-button
                        to="/"
                        type="button"
                        variant="primary">{{ buttonText }}</b-button>
                </div>
            </b-card>
        </b-row>
    </div>
</template>
<script>
import axios from 'axios'
import BigNumber from 'bignumber.js'
import urljoin from 'url-join'
export default {
    name: 'App',
    data () {
        return {
            config: {},
            tx: this.$route.params.transaction,
            status: 'fail',
            icon: '',
            title: '',
            description: '',
            buttonText: '',
            event: '',
            amount: '',
            candidate: '',
            txUrl: ''
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: async function () {
        let self = this
        self.config = await self.appConfig()

        axios.get(`/api/transactions/${self.tx}`).then(function (response) {
            if (response.data == null) {
                self.$router.push({ path: '/' })
            } else {
                let transaction = response.data

                self.web3.eth.getTransaction(self.tx, function (err, result) {
                    if (!err) {
                        self.status = result == null ? 'fail' : 'success'
                    } else {
                        self.status = 'fail'
                        console.log(err)
                    }

                    if (self.status === 'success') {
                        self.amount = new BigNumber(transaction.capacity).div(10 ** 18).toString(10)
                        self.icon = 'checkmark'
                        self.title = 'Success'
                        self.event = transaction.event === 'Vote' ? 'voted' : 'unvoted'
                        self.candidate = transaction.candidate
                        self.txUrl = urljoin(self.config.explorerUrl, `/txs/${self.tx}`)
                        // self.description = `You have ${event}
                        // <span class="color-white">${amount} TOMO</span> for candidate
                        // <router-link to="/candidate/${transaction.candidate}">${transaction.candidate}</router-link>
                        // successfully.
                        // <br/><br/>
                        // Transaction Hash: <a href="${self.config.explorerUrl}/txs/${self.tx}"
                        // target="_blank">${self.tx}</a>`
                        self.buttonText = 'View all Candidates'
                    } else {
                        self.icon = 'notice'
                        self.title = 'Transaction Failed'
                        self.description = 'You have voted unsuccessfully'
                        self.buttonText = 'Try Again'
                    }
                })
            }
        }).catch((e) => {
            console.log(e)
        })
    },
    mounted () {},
    methods: {}
}
</script>
