<template>
    <div class="table-container md-layout md-gutter md-alignment-center">
        <div class="md-layout-item md-xlarge-size-50 md-large-size-50 md-xsmall-size-100">
            <md-card>
                <md-card-header>
                    <p class="md-title">
                        <md-icon>{{ icon }}</md-icon>
                        {{ title }}</p>
                </md-card-header>

                <md-card-content>
                    <p
                        class="md-content"
                        v-html="description"/>
                </md-card-content>

                <md-card-actions>
                    <md-button
                        class="md-raised md-primary"
                        to="/">{{ buttonText }}</md-button>
                </md-card-actions>
            </md-card>
        </div>
    </div>
</template>
<script>
import axios from 'axios'
export default {
    name: 'App',
    data () {
        return {
            tx: this.$route.params.transaction,
            status: 'fail',
            icon: '',
            title: '',
            description: '',
            buttonText: ''
        }
    },
    computed: {},
    watch: {},
    updated () {},
    created: function () {
        let self = this
        self.$parent.showProgressBar = true

        axios.get(`/api/transactions/${self.tx}`).then(function (response) {
            if (response == null) {
                location.reload()
            }
            let transaction = response.data
            let event = transaction.event === 'Vote' ? 'voted' : 'unvoted'

            self.web3.eth.getTransaction(self.tx, function (err, result) {
                if (!err) {
                    self.status = result == null ? 'fail' : 'success'
                } else {
                    self.status = 'fail'
                    console.log(err)
                }

                if (self.status === 'success') {
                    self.icon = 'check'
                    self.title = 'Success'
                    self.description = `You have ${event} 
                    <strong>${transaction.capacity / 10 ** 18} $TOMO</strong> for candidate 
                    <a href="/candidate/${transaction.candidate}">${transaction.candidate}</a> successfully.
                    <br/><br/>
                    Transaction Hash: <a href="#" target="_blank">${self.tx}</a>`
                    self.buttonText = 'View all Candidates'
                } else {
                    self.icon = 'error_outline'
                    self.title = 'Transaction Failed'
                    self.description = 'You have voted unsuccessfully'
                    self.buttonText = 'Try Again'
                }
                self.$parent.showProgressBar = false
            })
        }).catch((e) => {
            self.$parent.showProgressBar = false
            console.log(e)
        })
    },
    mounted () {},
    methods: {}
}
</script>
