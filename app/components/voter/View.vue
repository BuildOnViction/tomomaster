<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Voter</div>
                    <div class="md-subhead">{{ voter }}</div>
                </md-card-header>

                <md-card-content>
                    <p>Your balance: <strong>100 $TOMO</strong></p>
                    <p>You voted: <strong>20 $TOMO</strong></p>
                </md-card-content>

                <md-table>
                    <md-table-toolbar>
                        <div class="md-title">Candidates
                            <div class="md-subhead">People who you voted</div>
                        </div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Address</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                        <md-table-head/>
                    </md-table-row>

                    <md-table-row>
                        <md-table-cell md-numeric>1</md-table-cell>
                        <md-table-cell>
                            0xaaa
                        </md-table-cell>
                        <md-table-cell>1 $TOMO</md-table-cell>
                        <md-table-cell>
                            <md-button
                                class="md-raised md-primary">Vote</md-button>
                            <md-button
                                class="md-raised md-accent">Unvote</md-button>
                        </md-table-cell>
                    </md-table-row>
                </md-table>
            </md-card>
        </div>
    </div>
</template>
<script>
export default {
    name: 'App',
    data () {
        return {
            voter: this.$route.params.address
        }
    }
}
</script>
