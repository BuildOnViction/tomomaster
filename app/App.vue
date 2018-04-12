<template>
  <div id="app">
    <div class="page-layout">
      <md-toolbar class="md-primary">
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <h3 class="md-title" style="flex: 1">TomoChain Governance</h3>
          </div>

          <div class="md-toolbar-section-end">
            <md-button class="md-raised" >Add New</md-button>

            <md-menu md-direction="bottom-start" md-align-trigger>
              <md-button md-menu-trigger>
                <md-icon>more_vert</md-icon>
              </md-button>

              <md-menu-content>
                <md-menu-item><md-button class="md-primary">Balance</md-button></md-menu-item>
              </md-menu-content>
            </md-menu>
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
                      <md-table-head>Name</md-table-head>
                      <md-table-head></md-table-head>
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
                      <md-table-head>Name</md-table-head>
                  </md-table-row>

                  <md-table-row>
                      <md-table-cell md-numeric>1</md-table-cell>
                      <md-table-cell>Shawna Dubbin</md-table-cell>
                      <md-table-cell>sdubbin0@geocities.com</md-table-cell>
                  </md-table-row>
              </md-table>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import 'vue-material/dist/theme/default.css'
Vue.use(VueMaterial)
export default {
  name: 'app',
  data() {
    return {
    };
  },
  computed: {
  },
  watch: {
    '$route'() { }
  },
  created() { },
  mounted() { },
  methods: { }
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
