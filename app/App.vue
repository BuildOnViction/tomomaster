<template>
  <div id="app">
    <div class="page-layout">
      <md-toolbar class="md-primary">
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <h3 class="md-title" style="flex: 1">TomoChain Governance</h3>
          </div>

          <div class="md-toolbar-section-end">
            <md-button class="md-raised" >Become a candidate</md-button>

            <!--md-menu md-direction="bottom-start" md-align-trigger>
              <md-button md-menu-trigger>
                <md-icon>more_vert</md-icon>
              </md-button>

              <md-menu-content>
                <md-menu-item><md-button class="md-primary">Balance</md-button></md-menu-item>
              </md-menu-content>
            </md-menu-->
          </div>
        </div>
      </md-toolbar>
      <div class="main-content">
          <div class="table-container">
              <md-table md-card>
                  <md-table-toolbar>
                      <h1 class="md-title">Candidates</h1>
                  </md-table-toolbar>

                  <md-table-row>
                      <md-table-head md-numeric>ID</md-table-head>
                      <md-table-head>Address</md-table-head>
                      <md-table-head>Capacity</md-table-head>
                      <md-table-head></md-table-head>
                  </md-table-row>
                  <md-table-row v-for="c, key in candidates">
                      <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                      <md-table-cell>{{ c.address }}</md-table-cell>
                      <md-table-cell>{{ c.cap }}</md-table-cell>
                      <md-table-cell><md-button class="md-raised md-primary" @click="voteActive = true; voteItem = c">Vote</md-button></md-table-cell>
                  </md-table-row>
              </md-table>
          </div>
          <div class="table-container">
              <md-table md-card>
                  <md-table-toolbar>
                      <h1 class="md-title">Validators</h1>
                  </md-table-toolbar>

                  <md-table-row>
                      <md-table-head md-numeric>ID</md-table-head>
                      <md-table-head>Address</md-table-head>
                      <md-table-head></md-table-head>
                  </md-table-row>

                  <md-table-row v-for="v, key in validators">
                      <md-table-cell md-numeric>{{ key + 1 }}</md-table-cell>
                      <md-table-cell>{{ v }}</md-table-cell>
                      <md-table-cell></md-table-cell>
                  </md-table-row>
              </md-table>
          </div>
      </div>
    </div>
    <md-dialog-prompt
                                :md-active.sync="voteActive"
                                v-model="voteValue"
                                md-title="How much?"
                                md-input-maxlength="30"
                                md-input-placeholder="Type $TOMO..."
                                md-confirm-text="Confirm" @md-confirm="vote()"/>
    <md-dialog-alert
                            :md-active.sync="isNotReady"
                            md-title="Note!"
                            md-content="You have to:<ul><li>Using chrome browser</li><li>Install/Login Metamask Plugin</li><li>Connect Metamask to Tomochain Mainnet or Testnet</li></ul>" />
  </div>
</template>

<script>
import Vue from 'vue';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';
import { default as contract } from 'truffle-contract';
import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json';
Vue.use(VueMaterial)

var web3 = window.web3 || false;
var TomoValidator = contract(TomoValidatorArtifacts);
var account;

export default {
  name: 'app',
  data() {
    return {
        isNotReady: !web3,
        voteActive: false,
        voteValue: 1,
        voteItem: {},
        validators: [],
        candidates: []
    };
  },
  computed: {
  },
  watch: {
    '$route'() { }
  },
  created() {
      var vm = this;
      TomoValidator.setProvider(web3.currentProvider);
      web3.eth.getAccounts(function(err, accs) {
          if (err != null) {
              console.log("There was an error fetching your accounts.");
              return;
          }

          if (accs.length == 0) {
              console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
              return;
          }

          account = accs[0];
      });
      TomoValidator.deployed().then(function(tv) {
          return tv.getValidators.call({from: account}).then(d => {
              vm.validators = d;
              return tv.getCandidates.call({from: account}).then(cs => {
                  var map = cs.map(it => { 
                      return tv.getCandidateCap.call(it, {from: account}).then(d => {
                          vm.candidates.push({
                              address: it, cap: String(d/10**18) + ' $TOMO'
                          });
                      });
                  });
                  return Promise.all(map);
              });
          });
      }).catch(e => {
          this.isNotReady = true;
          console.log(e);
      });

  },
  mounted() {
  },
  methods: {
      vote: function() {
          var candidate = this.voteItem;
          var value = this.voteValue
          TomoValidator.deployed().then(function(tv) {
              return tv.vote(candidate.address, {from: account, value: parseFloat(value)*10**18}).then((d) => {
                  return tv.getCandidateCap.call(candidate.address, {from: account}).then(d => {
                      candidate.cap = String(d/10**18) + ' $TOMO';
                  });
              });
          });
      }
  }
};
</script>

<style>
.main-content {
    width: 960px;
    margin: 0 auto;
}

.table-container {
    padding-top: 40px;
}

</style>
