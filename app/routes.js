import CandidateView from './components/candidates/View.vue'
import CandidateList from './components/candidates/List.vue'
import CandidateApply from './components/candidates/Apply.vue'
import CandidateResign from './components/candidates/Resign.vue'
import CandidateWithdraw from './components/candidates/Withdraw.vue'
import CandidateUpdate from './components/candidates/Update.vue'
import VoterView from './components/voters/View'
import VotingView from './components/voters/Voting'
import UnvotingView from './components/voters/Unvoting'
import ConfirmView from './components/voters/Confirm'
import Setting from './components/Setting.vue'
import PrivacyPolicy from './components/PrivacyPolicy.vue'
import TermsOfService from './components/TermsOfService.vue'

const routes = [
    {
        path: '/', component: CandidateList
    },
    {
        path: '/apply', component: CandidateApply
    },
    {
        path: '/resign', component: CandidateResign
    },
    {
        path: '/resign/:address', component: CandidateResign
    },
    {
        path: '/withdraw', component: CandidateWithdraw, name: 'CandidateWithdraw'
    },
    {
        path: '/withdraw/:address', component: CandidateWithdraw
    },
    {
        path: '/candidates', component: CandidateList
    },
    {
        path: '/candidate/:address', component: CandidateView
    },
    {
        path: '/candidate/:address/update', component: CandidateUpdate
    },
    {
        path: '/voter/:address', component: VoterView
    },
    {
        path: '/voting/:candidate', component: VotingView
    },
    {
        path: '/unvoting/:candidate', component: UnvotingView
    },
    {
        path: '/confirm/:transaction', component: ConfirmView
    },
    {
        path: '/setting', component: Setting
    },
    {
        path: '/privacyPolicy', component: PrivacyPolicy
    },
    {
        path: '/terms', component: TermsOfService
    }
]

export default routes
