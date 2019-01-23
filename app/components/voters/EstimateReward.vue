<template>
    <div class="float-left">
        Estimate reward: {{ value }}
    </div>
</template>
<script>
export default {
    props: {
        value: {
            type: String,
            default: ''
        }
    },
    created () {
        console.log(this.value)
    }
}
</script>
