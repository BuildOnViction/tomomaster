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
                    <md-button class="md-raised md-primary" @click="voteActive = true;">Vote</md-button>
                    <md-button class="md-raised md-accent" @click="unvoteActive = true;">Unvote</md-button>
                </md-card-actions>
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
                    })
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
