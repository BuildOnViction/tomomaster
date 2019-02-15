<template>
    <div class="autocomplete">
        <input
            v-model="search"
            type="text"
            class="form-control"
            placeholder="Search Candidate / Voter address ..."
            @input="onChange"
            @keydown.down="onArrowDown"
            @keydown.up="onArrowUp"
            @keydown.enter="onEnter" >
        <ul
            v-if="results.length > 0"
            v-show="isOpen"
            id="autocomplete-results"
            class="autocomplete-results">
            <li
                v-for="(result, i) in results"
                :key="i"
                :class="{ 'is-active': i === arrowCounter }"
                class="autocomplete-result"
                @click="setResult(result)">
                {{ result.name }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'AutoComplete',

    props: {
        items: {
            type: Array,
            required: false,
            default: () => []
        },
        isAsync: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data () {
        return {
            isOpen: false,
            results: [],
            search: '',
            arrowCounter: 0
        }
    },
    watch: {
    },
    mounted () {
        document.addEventListener('click', this.handleClickOutside)
    },
    destroyed () {
        document.removeEventListener('click', this.handleClickOutside)
    },
    methods: {
        onChange () {
            // Let's warn the parent that a change was made
            this.$emit('input', this.search)

            // Is the data given by an outside ajax request?
            if (this.isAsync) {
                this.isLoading = true
            } else {
                // Let's  our flat array
                this.filterResults()
                if (this.results.length > 0) {
                    this.isOpen = true
                }
            }
        },

        filterResults () {
            // first uncapitalize all the things
            let count = 0
            if (this.search !== '') {
                this.results = this.items.filter((item) => {
                    count++
                    if (count <= 5) {
                        return item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1
                    }
                })
            }
        },
        setResult (result) {
            this.search = ''
            this.isOpen = false
            this.$router.push({
                path: `/candidate/${result.address}`
            })
        },
        onArrowDown (evt) {
            if (this.arrowCounter < this.results.length) {
                this.arrowCounter = this.arrowCounter + 1
            }
        },
        onArrowUp () {
            if (this.arrowCounter > 0) {
                this.arrowCounter = this.arrowCounter - 1
            }
        },
        onEnter () {
            const result = this.results[this.arrowCounter]
            console.log(result)
            if (result) {
                this.search = ''
                this.isOpen = false
                this.arrowCounter = -1
                this.$router.push({
                    path: `/candidate/${result.address}`
                })
            }
        },
        handleClickOutside (evt) {
            if (!this.$el.contains(evt.target)) {
                this.isOpen = false
                this.arrowCounter = -1
            }
        }
    }
}
</script>
