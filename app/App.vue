<template>
    <div id="app">
        <div class="page-layout">
            <b-navbar>
                <div class="container">
                    <b-navbar-brand to="/">
                        <img src="/app/assets/img/logo.svg" >
                    </b-navbar-brand>

                    <b-nav-form class="search-form">
                        <auto-complete
                            v-model="search"
                            :items="items"/>
                        <b-button
                            variant="outline-success"
                            type="submit"
                            @click="searchCandidate">Search</b-button>
                    </b-nav-form>

                    <div class="navbar-buttons">
                        <b-button
                            v-if="!isTomonet"
                            id="btn-become-candidate"
                            to="/setting"
                            variant="primary">Login</b-button>
                        <b-button
                            v-else
                            id="btn-become-candidate"
                            to="/apply"
                            variant="primary">Become a candidate</b-button>

                        <!-- <router-link
                            v-if="isTomonet"
                            id="btn-setting"
                            to="/setting">
                            <i class="tm-cog ml-1 icon-2x" />
                        </router-link> -->

                        <!-- <a
                            href="#"
                            class="dd-setting">
                            <i
                                class="tm-bell ml-2 icon-2x"
                                @click="readClick" />
                        </a>
                        <div
                            :style="`${statusClass}`"
                            class="notification-menu-wrapper">
                            <div
                                class="header"
                                style="border-bottom: 1px solid; padding: 5px">
                                <span>Notifications</span>
                                <a
                                    href
                                    class="float-right"
                                    style="color: #216ba5">Mark all as read</a>
                            </div>
                            <div class="notification-wrapper">
                                <div style="text-align: center">No notifications.</div>
                            </div>
                            <div style="text-align: center; border-top: 1px solid; padding: 5px">
                                <a
                                    href
                                    style="color: #216ba5">Show all</a>
                            </div>
                        </div> -->

                        <b-dropdown
                            class="dd-setting"
                            right
                            offset="25"
                            no-caret
                            variant="link">
                            <template
                                slot="button-content">
                                <i
                                    class="tm-bell ml-2 icon-2x"
                                    @click="readClick" />
                                <span
                                    :class="`notification tomo-status-dot tomo-status-dot--yellow`"
                                    :style="(isTomonet ? (readNoti <= 0 ? 'display: none;': '') : statusClass)"/>
                            </template>
                            <b-dropdown-text>
                                <div
                                    style="text-align: center; font-size: 14px; font-weight: bold">
                                    Notifications
                                </div>
                            </b-dropdown-text>
                            <b-dropdown-divider />
                            <div
                                v-if="isTomonet"
                                style="max-height: 200px; overflow: auto;font-size: 14px">
                                <div
                                    v-for="(value, key) in notifications"
                                    :key="key">
                                    <b-dropdown-text v-if="value.event === 'SLASHED'">
                                        <div>
                                            <span
                                                :style="value.isRead ? 'font-size: 13px;' :
                                                'font-size: 13px; font-weight: bold'"
                                                class="notification__content">
                                                [
                                                <strong>SLASHED</strong>
                                                ] Masternode [
                                                <router-link :to="`/candidate/${value.candidate}`">
                                                    <strong>{{ value.name }}</strong>
                                                </router-link>
                                                ] has been slashed
                                            </span>
                                            <div style="font-size: 12px">TomoMaster -
                                                {{ value.createdAt }}</div>
                                        </div>
                                    </b-dropdown-text>
                                    <b-dropdown-divider
                                        v-if="value.event === 'SLASHED' &&
                                        key !== notifications.length - 1"/>

                                    <b-dropdown-text v-if="value.event === 'OUTTOP'">
                                        <div>
                                            <span style="font-size: 13px">
                                                [
                                                <strong>PROPOSED</strong>
                                                ] Masternode [
                                                <router-link :to="`/candidate/${value.candidate}`">
                                                    <strong>{{ value.name }}</strong>
                                                </router-link>
                                                ] left the top 150 and is no longer a masternode.
                                            </span>
                                            <div style="font-size: 12px">TomoMaster -
                                                {{ value.createdAt }}</div>
                                        </div>
                                    </b-dropdown-text>
                                    <b-dropdown-divider
                                        v-if="value.event === 'OUTTOP' &&
                                        key !== notifications.length - 1"/>
                                </div>
                            </div>
                            <div v-if="!isTomonet">
                                <b-dropdown-text>
                                    <div style="font-size: 13px;">
                                        <strong>TomoMaster up to 1.3.3.</strong>
                                        New features have been added to.
                                        <p>- Owner can add their website, telegram to masternode's information</p>
                                        <p>- Voter can see estimated daily reward when voting</p>
                                        <p>- Fix privacy issue regarding to new metamask updates</p>
                                    </div>
                                </b-dropdown-text>
                            </div>
                            <b-dropdown-divider />
                            <b-dropdown-item
                                v-if="isTomonet"
                                style="width: 340px; text-align: center; max-width: 500px;color: #216ba5"
                                @click="markReadAll">Mark all as read</b-dropdown-item>
                            <b-dropdown-text
                                v-if="!isTomonet"
                                style="width: 340px; text-align: center; max-width: 500px;color: #216ba5">
                                TomoMaster - {{ version }}
                            </b-dropdown-text>
                        </b-dropdown>

                        <b-dropdown
                            v-if="isTomonet"
                            class="dd-setting"
                            right
                            offset="25"
                            no-caret
                            variant="primary">
                            <template
                                slot="button-content">
                                <i class="tm-cog ml-2 icon-2x" />
                            </template>
                            <b-dropdown-item
                                :to="`/voter/${account}`"
                                class="dd-address">
                                {{ truncate(account, 20) }}
                            </b-dropdown-item>
                            <b-dropdown-divider />
                            <b-dropdown-item
                                target="_bank"
                                href="https://bit.ly/2B6p29o">Help</b-dropdown-item>
                            <b-dropdown-item to="/setting">Settings/Withdraws</b-dropdown-item>
                            <b-dropdown-divider />
                            <b-dropdown-item
                                href="/"
                                @click="signOut">Sign out</b-dropdown-item>
                        </b-dropdown>

                        <!-- <router-link
                        v-if="isTomonet"
                        id="btn-setting"
                        to="/setting">
                        <i class="tm-dots color-btn-bg"/>Setting</router-link> -->
                    </div>
                </div>
            </b-navbar>
            <div class="main-content">
                <router-view/>
            </div>
            <footer
                class="tomo-footer">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="tomo-footer__copyright">
                                TomoMaster &copy; {{ (new Date()).getFullYear() }} -
                                <a
                                    :href="`https://github.com/tomochain/tomomaster/releases/tag/v${version}`"
                                    class="version-tag">
                                    v{{ version }}</a>
                            </div>
                            <div class="tomo-footer__links">
                                <ul class="list-inline">
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="https://bit.ly/2B6p29o"><i class="tm-lifebuoy mr-1"/>Need help?</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/privacyPolicy"><i class="tm-lock mr-1"/>Privacy Policy</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/terms"><i class="tm-profile mr-1"/>Terms of Service</a>
                                    </li>
                                    <li class="list-inline-item">
                                        <a
                                            target="_blank"
                                            href="/apidocs"><i class="tm-checklist mr-1"/>API Documentation</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-md-4 tomo-footer__social">
                            <ul class="list-inline">
                                <li class="list-inline-item">
                                    <a
                                        href="https://t.me/tomochain"
                                        target="_blank">
                                        <i class="tm-telegram" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.facebook.com/tomochainofficial"
                                        target="_blank">
                                        <i class="tm-facebook" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://twitter.com/TomoChainANN"
                                        target="_blank">
                                        <i class="tm-twitter" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://github.com/tomochain/"
                                        target="_blank">
                                        <i class="tm-github" />
                                    </a>
                                </li>
                                <li class="list-inline-item">
                                    <a
                                        href="https://www.reddit.com/r/Tomochain/"
                                        target="_blank">
                                        <i class="tm-reddit" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import store from 'store'
import moment from 'moment'
import pkg from '../package.json'
import AutoComplete from './components/AutoComplete.vue'
export default {
    name: 'App',
    components: {
        AutoComplete
    },
    data () {
        return {
            isReady: !!this.web3,
            showProgressBar: false,
            selectedCandidate: null,
            search: null,
            isTomonet: false,
            version: pkg.version,
            account: '',
            items: [],
            statusClass: '',
            interval: '',
            notifications: [],
            readNoti: 0
        }
    },
    async updated () {
        await this.checkNetworkAndLogin()
    },
    destroyed () {
        if (this.interval) {
            clearInterval(this.interval)
        }
    },
    created: async function () {
        let self = this

        try {
            if (!self.isReady && self.NetworkProvider === 'metamask') {
                throw Error('Web3 is not properly detected. Have you installed MetaMask extension?')
            }
            self.$bus.$on('logged', async () => {
                await self.checkNetworkAndLogin()
                setTimeout(async () => {
                    await self.getNotification()
                }, 500)
            })
            const candidates = await axios.get('/api/candidates')
            const map = candidates.data.items.map((c) => {
                return {
                    name: c.name ? c.name : 'Anonymous',
                    address: c.candidate
                }
            })
            const mapping = await Promise.all(map)
            self.items = mapping
            setTimeout(async () => {
                await self.getNotification()
            }, 500)
            this.interval = setInterval(async () => {
                await this.getNotification()
            }, 40000)
        } catch (e) {
            console.log(e)
        }
    },
    methods: {
        searchCandidate (e) {
            e.preventDefault()
            const regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/

            let to = null
            let search = (this.search || '').trim()
            if (regexpAddr.test(search)) {
                axios.get(`/api/search/${search}`)
                    .then((response) => {
                        const data = response.data
                        if (Object.keys(data.candidate).length > 0) {
                            to = { path: `/candidate/${data.candidate.candidate}` }
                        } else if (Object.keys(data.voter).length > 0) {
                            to = { path: `/voter/${search}` }
                        } else {
                            this.$toasted.show('Not found')
                        }
                        if (!to) {
                            return false
                        }
                        this.search = ''
                        return this.$router.push(to)
                    }).catch(e => console.log(e))
            }
        },
        goPage: function (s) {
            this.$router.push({ path: `/candidate/${s}` })
        },
        async checkNetworkAndLogin () {
            let self = this
            setTimeout(async () => {
                try {
                    const contract = await self.getTomoValidatorInstance()
                    if (store.get('address')) {
                        self.account = store.get('address').toLowerCase()
                    } else {
                        self.account = this.$store.state.walletLoggedIn
                            ? this.$store.state.walletLoggedIn : await self.getAccount()
                    }
                    if (self.account && contract) {
                        self.isTomonet = true
                    }
                } catch (error) {}
            }, 0)
        },
        signOut () {
            store.clearAll()
            this.$store.state.walletLoggedIn = null

            this.$router.go({
                path: '/'
            })
        },
        async readClick () {
            this.statusClass = 'display: none;'
        },
        async getNotification () {
            try {
                const self = this
                if (self.account && self.isTomonet) {
                    const { data } = await axios.get('/api/voters/' + self.account.toLowerCase() + '/getNotification')
                    if (data.length > 0) {
                        let items = []
                        let readNoti = 0
                        data.map(d => {
                            if (!d.isRead) {
                                readNoti++
                            }
                            items.push({
                                event: d.event,
                                createdAt: moment(d.createdAt).fromNow(),
                                name: d.candidateName,
                                candidate: d.candidate,
                                isRead: d.isRead
                            })
                        })
                        self.readNoti = readNoti
                        self.notifications = items
                    }
                }
            } catch (error) {
                console.log(error)
            }
        },
        async markReadAll () {
            // mark read all
            this.readNoti = 0
            await axios.get('/api/voters/' + this.account.toLowerCase() + '/markReadAll')
            this.notifications = this.notifications.map(n => {
                n.isRead = true
                return n
            })
        }
    }
}
</script>
