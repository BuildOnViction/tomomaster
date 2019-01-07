<template>
    <div class="number-input">
        <input
            :disabled="inputDisabled"
            :min="min"
            :max="max"
            :step="step"
            v-model="currentValue"
            type="text"
            class="form-control"
            @blur="blur"
            @keydown.esc="blur"
            @keydown.enter="blur"
            @keydown.up.prevent="increment"
            @keydown.down.prevent="decrement">
        <button
            :disabled="decrementDisabled"
            class="decrement-button"
            type="button"
            @click="decrement">−</button>
        <button
            :disabled="incrementDisabled"
            class="increment-button"
            type="button"
            @click="increment">+</button>
    </div>
</template>
<script>
import BigNumber from 'bignumber.js'
export default {
    props: {
        disabled: {
            type: Boolean,
            default: false
        },
        max: {
            type: Number,
            default: Infinity
        },
        min: {
            type: Number,
            default: -Infinity
        },
        value: {
            type: String,
            required: true
        },
        step: {
            type: Number,
            default: 1
        }
    },

    data () {
        return {
            currentValue: (this.value) ? this.value.replace(/,/g, '') : '',
            decrementDisabled: false,
            incrementDisabled: false,
            inputDisabled: false
        }
    },

    watch: {
        value (val) {
            this.currentValue = val
        }
    },

    mounted () {
        if (new BigNumber(this.value) === this.min) {
            this.decrementDisabled = true
        }
    },

    methods: {
        increment () {
            if (this.disabled || this.incrementDisabled) {
                return
            }

            let val = new BigNumber(this.currentValue)
            let newVal = val.plus(this.step)
            this.decrementDisabled = false

            this._updateValue(newVal.toString())
        },
        decrement () {
            if (this.disabled || this.decrementDisabled) {
                return
            }

            let val = new BigNumber(this.currentValue)
            let newVal = val.minus(this.step)
            this.incrementDisabled = false

            this._updateValue(newVal.toString())
        },
        blur () {
            this.$emit('input', this.currentValue)
        },
        _updateValue (newVal) {
            const oldVal = new BigNumber(this.currentValue)

            if (oldVal === newVal) {
                return
            }
            if (newVal <= this.min) {
                newVal = this.min
                this.decrementDisabled = true
            }
            if (newVal >= this.max) {
                newVal = this.max
                this.incrementDisabled = true
            }
            this.currentValue = newVal.toString()
            this.$emit('input', this.currentValue)
        }
    }
}
</script>
