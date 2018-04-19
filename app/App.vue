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
          <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style>
.main-content {
    width: 960px;
    margin: 0 auto;
}

.table-container {
    padding-top: 40px;
}

</style>
