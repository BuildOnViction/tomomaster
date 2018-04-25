<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Candidate</div>
                    <div class="md-subhead">{{ candidate }}</div>
                </md-card-header>

                <md-card-content>
                    
                    <p>Total: {{ cap }} $TOMO</p>
                    <p>You voted: {{ iCap }} $TOMO</p>
                </md-card-content>

                <md-card-actions>
                    <md-button @click="voteActive = true;" class="md-primary"><md-icon>arrow_upward</md-icon> Vote</md-button>
                    <md-button @click="unvoteActive = true;" class="md-accent"><md-icon>arrow_downward</md-icon> Unvote</md-button>
                </md-card-actions>
                <md-table>
                    <md-table-toolbar>
                        <div class="md-title">Voters</div>
                    </md-table-toolbar>

                    <md-table-row>
                        <md-table-head md-numeric>ID</md-table-head>
                        <md-table-head>Address</md-table-head>
                        <md-table-head>Capacity</md-table-head>
                    </md-table-row>
                    <md-table-row v-for="v, key in voters" :key="v.address">
                        <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                        <md-table-cell>{{ v.address }}</md-table-cell>
                        <md-table-cell>{{ v.cap }}</md-table-cell>
                    </md-table-row>
                </md-table>
            </md-card>
        </div>
        <md-dialog-prompt
                                              :md-active.sync="voteActive"
                                              v-model="voteValue"
                                              md-title="How much?"
                                              md-input-maxlength="30"
                                              md-input-placeholder="Type $TOMO..."
                                              md-confirm-text="Confirm" @md-confirm="vote()"/>
        <md-dialog-prompt
                                              :md-active.sync="unvoteActive"
                                              v-model="unvoteValue"
                                              md-title="How much?"
                                              md-input-maxlength="30"
                                              md-input-placeholder="Type $TOMO..."
                                              md-confirm-text="Confirm" @md-confirm="unvote()"/>
    </div>
</template>
<script>
export default {
    name: 'app',
    data() {
        return { 
            voteActive: false,
            voteValue: 1,
            unvoteActive: false,
            unvoteValue: 1,
            voters: [],
            candidate: this.$route.params.address,
            cap: 0,
            iCap: 0
        };
    },
    computed: { },
    watch: {},
    updated() {},
    created() {
        var vm = this;
        var candidate = vm.$route.params.address;
        vm.getAccount().then( account => {
            vm.TomoValidator.deployed().then(function(tv) {
                return tv.getCandidateCap.call(candidate, {from: account}).then(cap => {
                    vm.cap = String(cap/10**18);
                    return tv.getVoterCap.call(candidate, account, {from: account}).then(iCap => {
                        vm.iCap = String(iCap/10**18);
                        return tv.getVoters.call(candidate, {from: account}).then(vs => {
                            var map = vs.map(it => {
                                return tv.getVoterCap(candidate, it, {from: account}).then(cap => {
                                    vm.voters.push({
                                        address: it,
                                        cap: String(cap/10**18)
                                    });
                                });
                            });
                            Promise.all(map);
                        });
                    });
                });
            }).catch(e => {
                console.log(e);
            });
        });

    },
    mounted() {
    },
    methods: {
        vote: function() {
            var vm = this;
            var account = vm.account;
            var candidate = vm.candidate;
            var value = this.voteValue
            vm.getAccount().then(account => {
                vm.TomoValidator.deployed().then(function(tv) {
                    return tv.vote(candidate, {from: account, value: parseFloat(value)*10**18}).then((d) => {
                        return tv.getCandidateCap.call(candidate, {from: account}).then(d => {
                            vm.cap = String(d/10**18);
                        });
                    });
                });
            });
        },
        unvote: function() {
            var vm = this;
            var account = vm.account;
            var candidate = vm.candidate;
            var value = this.unvoteValue
            vm.getAccount().then(account => {
                vm.TomoValidator.deployed().then(function(tv) {
                    return tv.unvote(candidate, String(parseFloat(value)*10**18), {from: account}).then((d) => {
                        return tv.getCandidateCap.call(candidate, {from: account}).then(d => {
                            vm.cap = String(d/10**18);
                        });
                    });
                });
            });
        }
    }
};
</script>
