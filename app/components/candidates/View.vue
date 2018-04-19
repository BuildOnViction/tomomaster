<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Candidate</div>
                    <div class="md-subhead">{{ $route.params.address }}</div>
                </md-card-header>

                <!--md-card-content>
                    
                </md-card-content-->

                <!--md-card-actions>
                    <md-button>Action</md-button>
                    <md-button>Action</md-button>
                </md-card-actions-->
            </md-card>
        </div>
    </div>
</template>
<script>
import Vue from 'vue';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.css';
import 'vue-material/dist/theme/default.css';
Vue.use(VueMaterial)

export default {
    name: 'app',
    data() {
        return {};
    },
    beforeRouteUpdate(to) {
        this.address = to.params.address;
    },
    computed: { },
    watch: {},
    updated() {},
    created() {},
    mounted() {
    },
    methods: {
    }
};
</script>
