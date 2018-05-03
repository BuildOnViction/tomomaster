<template>
    <div id="app">
        <div class="page-layout">
            <md-toolbar class="md-primary">
                <div class="md-toolbar-row">
                    <div class="md-toolbar-section-start"><router-link to="/">
                        <h3
                            class="md-title"
                            style="flex: 1">TomoChain Governance</h3></router-link>
                    </div>

                    <md-autocomplete
                        v-if="!isNotReady"
                        v-model="selectedCandidate"
                        :md-options="candidates"
                        class="search"
                        md-layout="box"
                        @md-selected="goPage">
                        <label>Search...</label>
                    </md-autocomplete>
                    <div class="md-toolbar-section-end">
                        <md-button
                            v-if="!isNotReady && !isCandidate"
                            class="md-raised"
                            to="/apply">
                            Become a candidate
                        </md-button>

                        <md-menu
                            md-direction="bottom-start"
                            md-align-trigger>
                            <md-button
                                class="md-icon-button"
                                md-menu-trigger>
                                <md-icon>more_vert</md-icon>
                            </md-button>

                            <md-menu-content>
                                <md-menu-item>
                                    <md-button
                                        to="/retire"
                                        class="md-accent">
                                        <md-icon>arrow_downward</md-icon> Retire
                                    </md-button>
                                </md-menu-item>
                                <md-menu-item>
                                    <md-button
                                        to="/setting"
                                        class="md-primary">
                                        <md-icon>settings</md-icon> Settings
                                    </md-button>
                                </md-menu-item>
                            </md-menu-content>
                        </md-menu>
                    </div>
                </div>
            </md-toolbar>
            <div class="main-content">
                <router-view/>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'App',
    data () {
        return {
            isNotReady: !this.web3,
            selectedCandidate: null,
            candidates: [],
            isCandidate: false
        }
    },
    created () {
        var vm = this
        var account = vm.account
        vm.getAccount().then(account => {
            return vm.TomoValidator.deployed().then(function (tv) {
                return tv.isCandidate(account).then(rs => {
                    vm.isCandidate = rs
                })
            })
        }).catch(e => console.log(e))
        vm.TomoValidator.deployed().then(function (tv) {
            return tv.getCandidates.call({ from: account }).then(cs => {
                vm.candidates = cs
            })
        }).catch(e => {
            this.isNotReady = true
        })
    },
    methods: {
        goPage: function (s) {
            this.$router.push({ path: '/candidates/' + s })
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
