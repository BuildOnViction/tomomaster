<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Confirm</div>
                </md-card-header>

                <md-card-content>
                    <md-list class="md-double-line">
                        <md-list-item>
                            <md-icon>how_to_vote</md-icon>
                            <div class="md-list-item-text">
                                <span>{{ voter }}</span>
                                <span>Voter</span>
                            </div>
                        </md-list-item>
                        <md-list-item>
                            <md-icon>account_circle</md-icon>
                            <div class="md-list-item-text">
                                <span>{{ candidate }}</span>
                                <span>Candidate</span>
                            </div>
                        </md-list-item>
                    </md-list>
                </md-card-content>
            </md-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'App',
    data () {
        return {
            voter: '',
            candidate: this.$route.params.address
        }
    },
    computed: {
    },
    watch: {
    },
    updated () {},
    created: async function () {
        let self = this
        try {
            let account = await self.getAccount()
            self.voter = account
        } catch (e) {
            console.log(e)
        }
    }
}
</script>
