<template>
  <div id="app">
    <div class="page-layout mainScreen">
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
                <md-menu-item><md-button class="md-primary">Show Your Private Key</md-button></md-menu-item>
              </md-menu-content>
            </md-menu>
          </div>
        </div>
      </md-toolbar>
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

</style>
