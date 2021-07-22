import BigNumber from 'bignumber.js'
import TomoValidatorArtifacts from '../build/contracts/TomoValidator.json'

const Helper = {
    getCurrencySymbol () {
        return 'SDX'
    },
    formatCurrencySymbol (number) {
        let unit = this.getCurrencySymbol()

        if (unit === null) {
            unit = 'SDX'
        }
        return `${number} ${unit}`
    },
    getDefaultState () {
        return {
            items: [],
            status: 'empty'
        }
    },
    truncate (fullStr, strLen) {
        if (fullStr.length <= strLen) return fullStr

        const separator = '...'

        let sepLen = separator.length
        let charsToShow = strLen - sepLen
        let frontChars = Math.ceil(charsToShow / 2)
        let backChars = Math.floor(charsToShow / 2)

        return fullStr.substr(0, frontChars) +
               separator +
               fullStr.substr(fullStr.length - backChars)
    },
    serializeQuery (params, prefix) {
        const query = Object.keys(params).map((key) => {
            const value = params[key]

            if (params.constructor === Array) {
                key = `${prefix}[]`
            } else {
                if (params.constructor === Object) {
                    key = (prefix ? `${prefix}[${key}]` : key)
                }
            }

            return value === 'object' ? this.serializeQuery(value, key) : `${key}=${encodeURIComponent(value)}`
        })

        return [].concat.apply([], query).join('&')
    },
    getSecondsToHms  (number) {
        number = parseInt(number, 10)
        if (number < 0) {
            return 'Available to withdraw'
        }

        number = number * 2

        let h = Math.floor(number / 3600)
        let m = Math.floor(number % 3600 / 60)
        let s = Math.floor(number % 3600 % 60)

        if (h < 10) { h = '0' + h }
        if (m < 10) { m = '0' + m }
        if (s < 10) { s = '0' + s }

        return `${h}:${m}:${s}`
    },
    checkLongNumber (num) {
        let str = num.toString().split('.')

        return (typeof str[1] !== 'undefined' && str[1].length > 3)
    },
    formatNumber (number) {
        let seps = (number || 0).toString().split('.')
        seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

        return seps.join('.')
    },
    formatBigNumber (num, dp) {
        if (this.checkLongNumber(num)) {
            return new BigNumber(num).toFormat(dp)
        }

        return this.formatNumber(num)
    },
    TomoValidatorArtifacts
}

export default Helper
