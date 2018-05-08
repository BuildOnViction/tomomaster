<template>
    <div>
        <div class="table-container">
            <md-card>
                <md-card-header>
                    <div class="md-title">Voter</div>
                    <div class="md-subhead">{{ voter }}</div>
                </md-card-header>
            </md-card>
        </div>
    </div>
</template>
<script>
export default {
  name: 'App',
  data () {
      return {
          voter: this.$route.params.address
      }
  }
}
</script>
