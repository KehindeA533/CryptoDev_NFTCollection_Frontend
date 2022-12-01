import styles from '../styles/Home.module.css'
import { ConnectButton } from 'web3uikit'

export default function Header() {
  return (
    <nav className="p-5 border-b-2 flex flex-row">
      <h1 className="py-4 px-4 font-semibold text-2xl">Crypto Devs</h1>
      <div className="ml-auto py-2 px-4">
        <ConnectButton moralisAuth={false} />
      </div>
    </nav>
  )
}

// 31:15
