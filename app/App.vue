<template>
  <div id="app">
    <div class="page-layout">
      <md-toolbar class="md-primary">
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <h3 class="md-title" style="flex: 1">TomoChain Governance</h3>
          </div>

          <md-autocomplete
                class="search"
                v-if="!isNotReady"
                v-model="selectedCandidate"
                @md-selected="goPage"
                :md-options="candidates"
                md-layout="box">
                <label>Search...</label>
          </md-autocomplete>
          <div class="md-toolbar-section-end">
              <md-button class="md-raised" to="/apply" v-if="!isNotReady">{{ isCandidate ? 'Retire' : 'Become a candidate' }}</md-button>

            <md-menu md-direction="bottom-start" md-align-trigger>
              <md-button md-menu-trigger>
                <md-icon>more_vert</md-icon>
              </md-button>

              <md-menu-content>
                  <md-menu-item><md-button class="md-primary"><md-icon>settings</md-icon> <router-link to="/setting">Settings</router-link></md-button></md-menu-item>
              </md-menu-content>
            </md-menu>
          </div>
        </div>
      </md-toolbar>
      <div class="main-content">
          <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'app',
    data() {
        return {
            isNotReady: !this.web3,
            selectedCandidate: null,
            candidates: [],
            isCandidate: false
        };
    },
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
        vm.TomoValidator.deployed().then(function(tv) {
            return tv.getCandidates.call({from: account}).then(cs => {
                vm.candidates = cs;
            });
        }).catch(e => {
            this.isNotReady = true;
            console.log(e);
        });

    },
    methods: {
        goPage: function(s) {
            this.$router.push({ path: '/candidates/' + s });
        }
    }
}
</script>
<style>
.main-content {
    width: 960px;
    margin: 0 auto;
}

.table-container {
    padding-top: 40px;
}
.search {
    max-width: 500px;
}

</style>
