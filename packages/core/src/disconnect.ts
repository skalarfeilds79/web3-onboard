import { getBNMulitChainSdk } from './services.js'
import { state } from './store/index.js'
import { removeWallet } from './store/actions.js'
import { disconnectWallet$ } from './streams.js'
import type { DisconnectOptions, WalletState } from './types.js'
import { validateDisconnectOptions } from './validation.js'
import { delLocalStore, getLocalStore } from './utils'
import { STORAGE_KEYS } from './constants'

async function disconnect(options: DisconnectOptions): Promise<WalletState[]> {
  const error = validateDisconnectOptions(options)
  if (error) {
    throw error
  }

  const { label } = options

  if (state.get().notify.enabled) {
    // handle unwatching addresses
    const sdk = await getBNMulitChainSdk()

    if (sdk) {
      const wallet = state.get().wallets.find(wallet => wallet.label === label)

      wallet.accounts.forEach(({ address }) => {
        sdk.unsubscribe({
          id: address,
          chainId: wallet.chains[0].id,
          timeout: 60000
        })
      })
    }
  }

  disconnectWallet$.next(label)
  removeWallet(label)

  if (getLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET) === label) {
    delLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET)
  }

  return state.get().wallets
}

export default disconnect
