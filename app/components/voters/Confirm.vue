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
    created () {
        let self = this
        this.web3.eth.getTransaction(self.tx, function (err, result) {
            if (!err) {
                self.status = result == null ? 'fail' : 'success'
            } else {
                self.status = 'fail'
                console.log(err)
            }

            if (self.status === 'success') {
                self.icon = 'check'
                self.title = 'Success'
                self.description = `You have voted 
                <strong>${result.value.toNumber() / 10 ** 18} $TOMO</strong> for candidate 
                <a href="/candidate/${result.to}">${result.to}</a> successfully.
                <br/><br/>
                Transaction Hash: ${self.tx}`
                self.buttonText = 'See all Candidates'
            } else {
                self.icon = 'error_outline'
                self.title = 'Transaction Failed'
                self.description = 'You have voted unsuccessfully'
                self.buttonText = 'Try Again'
            }
        })
    },
    mounted () {},
    methods: {}
}
</script>
