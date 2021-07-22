<template>
    <div class="autocomplete">
        <input
            id="search-input"
            v-model="search"
            type="text"
            class="form-control"
            placeholder="Search Masternode / Staker"
            @input="onChange"
            @focus="onChange"
            @keydown.enter="onEnter"
            @keydown.esc="onEsc"
            @keydown.down="onArrowDown"
            @keydown.up="onArrowUp" >
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
                <p
                    class="tomo-list__text">
                    <span>{{ result.rank ? result.rank + '. ' : '' }} {{ result.name || 'Anonymous' }} -
                        {{ result.status }}
                    </span>
                    <small>{{ result.candidate }}</small>
                    <!-- <span v-html="formatResult(result.name)" />
                    <small v-html="formatResult(result.candidate)" /> -->
                </p>
            </li>
        </ul>
    </div>
</template>

<script>
import axios from 'axios'
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
        search: async function (newValue, oldValue) {
            if (newValue !== '') {
                this.doSearch()
            } else {
                this.results = []
            }
        }
    },
    mounted () {
        document.addEventListener('click', this.handleClickOutside)
        // document.addEventListener('keyup', this.focusSearchInput)
    },
    destroyed () {
        document.removeEventListener('click', this.handleClickOutside)
        // document.removeEventListener('click', this.focusSearchInput)
    },
    methods: {
        // focusSearchInput (evt) {
        //     if (evt.key === 's' || evt.key === '/') {
        //         document.getElementById('search-input').focus()
        //     }
        // },
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
                    this.arrowCounter = 0
                }
            }
        },
        filterResults () {
            // first uncapitalize all the things
            if (this.search) {
                this.results = this.items.filter((item) => {
                    // search by name
                    let found = item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1

                    // search by address
                    if (!found) {
                        found = item.candidate.toLowerCase().indexOf(this.search.toLowerCase()) > -1
                    }

                    return found
                })
                this.results = this.results.slice(0, 5)
            }
        },
        formatResult (str) {
            if (!str) {
                return this.search
            }

            if (!this.search) {
                return str
            }

            return str.replace(new RegExp(this.search, 'gi'), (match) => {
                return `<mark>${match}</mark>`
            })
        },
        setResult (result) {
            this.search = ''
            this.isOpen = false
            this.$router.push({
                path: `/candidate/${result.candidate}`
            })
        },
        onArrowDown () {
            if (this.arrowCounter < this.results.length - 1) {
                this.arrowCounter++
            }
        },
        onArrowUp () {
            if (this.arrowCounter > 0) {
                this.arrowCounter--
            }
        },
        onEnter () {
            let result = this.results[this.arrowCounter]

            if (result) {
                this.search = ''
                this.isOpen = false
                this.arrowCounter = -1
                this.$router.push({
                    path: `/candidate/${result.candidate}`
                })
                document.getElementById('search-input').blur()
            }
        },
        onEsc () {
            this.isOpen = false
            this.arrowCounter = -1
            document.getElementById('search-input').blur()
        },
        handleClickOutside (evt) {
            if (!this.$el.contains(evt.target)) {
                this.isOpen = false
                this.arrowCounter = -1
            }
        },
        async doSearch () {
            const { data } = await axios.get('/api/candidates/search?page=1&limit=4&query=' + this.search || '')
            this.results = data.items
            this.isOpen = true
        }
    }
}
</script>
