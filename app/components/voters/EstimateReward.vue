<template>
    <div
        v-if="estimatedReward !== 'N/A'"
        class="float-left">
        Est. reward: {{ estimatedReward }}
    </div>
</template>
<script>
import axios from 'axios'
export default {
    props: {
        value: {
            type: String,
            default: ''
        },
        candidate: {
            type: String,
            default: ''
        }
    },
    data: () => {
        return {
            estimatedReward: 'N/A'
        }
    },
    watch: {
        value: async function (newVal, oldVal) {
            if (newVal !== oldVal) {
                await this.calculateRewards()
            }
        }
    },
    async created () {
        await this.calculateRewards()
    },
    methods: {
        async calculateRewards () {
            const self = this
            const params = {
                candidate: self.candidate,
                amount: self.value
            }
            const query = self.serializeQuery(params)
            const { data } = await axios.get('/api/voters/calculatingReward' + '?' + query)

            self.estimatedReward = data !== 'N/A' ? data.toFixed(6) : data
        }
    }
}
</script>
