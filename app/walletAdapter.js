const Web3 = require('web3')

// override order: coin98 > viction > ramper > metamask
const walletAdapter = {

    WALLET_TYPE: Object.freeze({
        COIN98: 'coin98',
        VICTION: 'viction',
        RAMPER: 'ramper',
        METAMASK: 'metamask'
    }),
    connectCoin98: async (supportedWalletOption) => {
        let provider = null
        if (window.coin98) {
            provider = window.coin98.provider
        }
        if (!provider) {
            return { error: 'Please install Coin98 wallet' }
        }
        const chainId = await provider.request({
            method: 'net_version'
        })
        try {
            if (supportedWalletOption[0].chainId !== chainId) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: supportedWalletOption
                })
            }
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            })
            return accounts[0]
        } catch (error) {
            console.log(error)
            return { error: `Unable to connect Coin98 wallet: ${error.message}` }
        }
    },

    connectViction: async () => {
        let provider = null
        if (window.coin98) {
            provider = window.coin98.provider
        } else if (window.viction) {
            provider = window.viction
        }
        if (!provider) {
            return { error: 'Please install Viction wallet' }
        }
        try {
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            })
            return accounts[0]
        } catch (error) {
            console.log(error)
            return { error: `Unable to connect Viction wallet: ${error.message}` }
        }
    },

    connectRamper: async (supportedWalletOption) => {
        let provider = null
        if (window.coin98) {
            provider = window.coin98.provider
        } else if (window.viction) {
            provider = window.viction
        } else if (window.ramper2) {
            provider = window.ramper2.provider
        }
        if (!provider) {
            return { error: 'Please install Ramper wallet' }
        }
        const chainId = await provider.request({
            method: 'net_version'
        })
        try {
            if (supportedWalletOption[0].chainId !== chainId) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: supportedWalletOption
                })
            }
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            })
            return accounts[0]
        } catch (error) {
            console.log(error)
            return { error: `Unable to connect Ramper wallet: ${error.message}` }
        }
    },

    connectMetamask: async (supportedWalletOption) => {
        let provider = null
        if (window.coin98) {
            provider = window.coin98.provider
        } else if (window.viction) {
            provider = window.viction
        } else if (window.ramper2) {
            provider = window.ramper2.provider
        } else if (window.ethereum) {
            provider = window.ethereum
        }
        if (!provider) {
            return { error: 'Please install Metamask wallet' }
        }
        const chainId = await window.ethereum.request({
            method: 'net_version'
        })
        try {
            if (supportedWalletOption[0].chainId !== chainId) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: supportedWalletOption
                })
            }
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            })
            return accounts[0]
        } catch (error) {
            console.log(error)
            return { error: `Unable to connect Metamask wallet: ${error.message}` }
        }
    },
    loadCoin98Provider: async () => {
        let p
        if (window.coin98) {
            p = window.coin98.provider
        }
        return new Web3(p)
    },
    loadVictionProvider: async () => {
        let p
        if (window.coin98) {
            p = window.coin98.provider
        } else if (window.viction) {
            p = window.viction
        }
        return new Web3(p)
    },
    loadRamperProvider: async () => {
        let p
        if (window.coin98) {
            p = window.coin98.provider
        } else if (window.viction) {
            p = window.viction
        } else if (window.ramper2) {
            p = window.ramper2.provider
        }
        return new Web3(p)
    },
    loadMetamaskProvider: async () => {
        let p
        if (window.coin98) {
            p = window.coin98.provider
        } else if (window.viction) {
            p = window.viction
        } else if (window.ramper2) {
            p = window.ramper2.provider
        } else if (window.ethereum) {
            p = window.ethereum
        }
        return new Web3(p)
    }
}
walletAdapter.SupportedWallets = {
    [walletAdapter.WALLET_TYPE.COIN98]: true,
    [walletAdapter.WALLET_TYPE.VICTION]: true,
    [walletAdapter.WALLET_TYPE.RAMPER]: true,
    [walletAdapter.WALLET_TYPE.METAMASK]: true

}
module.exports = walletAdapter
