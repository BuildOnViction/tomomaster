<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Become a Candidate</div>
                </md-card-header>

                <md-card-content>
                    You have to:
                    <ul>
                        <li>Deposit at least 10000 $TOMO</li>
                        <li>Your deposit will be locked</li>
                    </ul>
                    Gains:
                    <ul>
                        <li>Coin holder is able to vote for you to become a validator</li>
                    </ul>
                </md-card-content>

                <md-card-actions>
                    <md-button v-if="!isCandidate" @click="applyActive = true;" class="md-primary"><md-icon>arrow_upward</md-icon> Apply</md-button>
                    <md-button v-if="isCandidate" @click="retireActive = true;" class="md-accent"><md-icon>arrow_downward</md-icon> Retire</md-button>
                </md-card-actions>
            </md-card>
        </div>
        <md-dialog-prompt
            :md-active.sync="applyActive"
            v-model="applyValue"
            md-title="How much? (at least 10000 $TOMO)"
            md-input-maxlength="30"
            md-input-placeholder="Type $TOMO..."
            md-confirm-text="Confirm" @md-confirm="apply()"/>
        <md-dialog-confirm
            :md-active.sync="retireActive"
            md-title="Do you want to retire?"
            md-content="If you retire, you will receive back all your deposit."
            md-confirm-text="Confirm" @md-confirm="retire()"/>
        <md-snackbar 
            :md-active.sync="showSnackbar"
            md-position="center"
            md-persistent>
            <span>{{ snackbarMessage }}</span>
            <md-button class="md-primary" @click="showSnackbar = false">OK</md-button>
        </md-snackbar>
    </div>
</template>
<script>
export default {
    name: 'app',
    data() {
        return { 
            applyActive: false,
            retireActive: false,
            showSnackbar: false,
            isCandidate: false,
            snackbarMessage: 'You have successfully applied!',
            applyValue: 10000
        };
    },
    computed: { },
    watch: {},
    updated() {},
    created() {
        var vm = this;
        var account = vm.account;
         vm.getAccount().then( account => {
            vm.TomoValidator.deployed().then(function(tv) {
                return tv.isCandidate(account).then(rs => {
                    vm.isCandidate = rs;
                });
            });
        });
    },
    mounted() {
    },
    methods: {
        apply: function() {
            var vm = this;
            var account = vm.account;
            var value = this.applyValue
            vm.getAccount().then(account => {
                vm.TomoValidator.deployed().then(function(tv) {
                    return tv.propose({from: account, value: parseFloat(value)*10**18}).then(() => {
                        vm.showSnackbar = true;
                    });
                });
            });
        },
        retire: function() {
            var vm = this;
            var account = vm.account;
            vm.getAccount().then(account => {
                vm.TomoValidator.deployed().then(function(tv) {
                    return tv.retire({from: account}).then(() => {
                        vm.showSnackbar = true;
                        vm.snackbarMessage = 'You have successfully retired. Thank you!';
                    });
                });
            });
        }
    }
};
</script>
