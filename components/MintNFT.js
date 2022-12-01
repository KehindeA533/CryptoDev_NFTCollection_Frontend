import styles from '../styles/Home.module.css'
import { contractAddress, abi } from '../constants'
import { useMoralis, useWeb3Contract } from 'react-moralis'
import { useEffect, useState } from 'react'
import { useNotification } from 'web3uikit'
import { Cross } from '@web3uikit/icons'
import { Checkmark } from '@web3uikit/icons'
import { ethers } from 'ethers'

export default function MintNFT() {
  /*//////////////////////////////////////////////////////////////   
                            Variables
//////////////////////////////////////////////////////////////*/
  const dispatch = useNotification()

  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()

  const chainId = parseInt(chainIdHex)

  const nftCollectionAddress =
    chainId in contractAddress ? contractAddress[chainId][0] : null

  const [tokenIdsMinted, setTokenIdsMinted] = useState('0')
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleState, setPresaleState] = useState(false)
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(0)

  const [isOwner, setIsOwner] = useState(false)

  const [loading, setLoading] = useState(false)

  /*//////////////////////////////////////////////////////////////   
                    Call to functions
//////////////////////////////////////////////////////////////*/

  const { runContractFunction: startPresale } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'startPresale',
    params: {},
  })
  const { runContractFunction: presaleMint } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'presaleMint',
    params: {},
    msgValue: ethers.utils.parseEther('0.01'),
  })
  const { runContractFunction: mint } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'mint',
    params: {},
    msgValue: ethers.utils.parseEther('0.01'),
  })
  const { runContractFunction: getPrice } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'getPrice',
    params: {},
  })
  const { runContractFunction: getpresaleState } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'getpresaleState',
    params: {},
  })
  const { runContractFunction: getpresaleEnded } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'getpresaleEnded',
    params: {},
  })
  const { runContractFunction: getTokenIds } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'getTokenIds',
    params: {},
  })
  const { runContractFunction: owner } = useWeb3Contract({
    abi: abi,
    contractAddress: nftCollectionAddress,
    functionName: 'owner',
    params: {},
  })

  async function callOwner() {
    try {
      const ownerfromCall = await owner()
      if (account.toUpperCase() === ownerfromCall.toUpperCase()) {
        setIsOwner(true)
      } else {
        setIsOwner(false)
      }
    } catch (error) {
      console.log(error)
    }
  }
  async function _presaleEnded() {
    try {
      const presaleEndedfromCall = await getpresaleEnded()
      const hasEnded = presaleEndedfromCall.lt(Math.floor(Date.now() / 1000))
      if (hasEnded) {
        setPresaleEnded(true)
      } else {
        setPresaleEnded(false)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async function updateUIValues() {
    try {
      const tokenIdsfromCall = (await getTokenIds()).toString()
      const presaleStatefromCall = await getpresaleState()
      setTokenIdsMinted(tokenIdsfromCall)
      setPresaleState(presaleStatefromCall)
    } catch (error) {
      console.log(error)
    }
  }

  /*//////////////////////////////////////////////////////////////   
                          Transactions
  //////////////////////////////////////////////////////////////*/
  async function _startPresale() {
    setLoading(true)
    await startPresale({
      onSuccess: handleSuccess,
      onError: (error) => {
        console.log(error)
      },
    })
    setLoading(false)
  }

  async function _presaleMint() {
    setLoading(true)
    await presaleMint({
      onSuccess: handleSuccess,
      onError: (error) => {
        console.log(error)
      },
    })
    setLoading(false)
  }

  async function _mint() {
    setLoading(true)
    await mint({
      onSuccess: handleSuccess,
      onError: (error) => {
        console.log(error)
      },
    })
    setLoading(false)
  }

  /*//////////////////////////////////////////////////////////////   
  Notifications
  //////////////////////////////////////////////////////////////*/
  const handleNewNotification = () => {
    dispatch({
      type: 'info',
      message: 'Transaction Complete!',
      title: 'Transaction Notification',
      position: 'topR',
      icon: <Checkmark fontSize="50px" />,
    })
  }

  const handleErrorNotification = () => {
    dispatch({
      type: 'error',
      message: 'Switch To Goerli!',
      title: 'Wrong Network',
      position: 'topR',
      icon: <Cross fontSize="50px" />,
    })
  }

  const handleSuccess = async (tx) => {
    try {
      await tx.wait(1)
      updateUIValues()
      _presaleEnded()
      handleNewNotification(tx)
    } catch (erorr) {
      console.log(erorr)
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      setInterval(async function () {
        updateUIValues()
        _presaleEnded()
      }, 5 * 1000)
    }

    // Set an interval which gets called every 5 seconds to check presale has ended
    const presaleEndedInterval = setInterval(async function () {
      const presaleStatefromCall = await getpresaleState()
      if (presaleStatefromCall) {
        const presaleEndedfromCall = await getpresaleEnded()
        if (presaleEndedfromCall) {
          clearInterval(presaleEndedInterval)
        }
      }
    }, 5 * 1000)
  }, [isWeb3Enabled])

  useEffect(() => {
    if (chainId !== 5) {
      handleErrorNotification()
    }
    callOwner()
  }, [account])

  /*//////////////////////////////////////////////////////////////   
                            Button
//////////////////////////////////////////////////////////////*/
  const renderButton = () => {
    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (!presaleState && isOwner) {
      return (
        <button className={styles.button} onClick={_startPresale}>
          Start Presale
        </button>
      )
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleState) {
      return (
        <div>
          <div className={styles.description}>Presale hasn't started!</div>
        </div>
      )
    }

    if (loading) {
      return (
        <div className={styles.button}>
          <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
        </div>
      )
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleState && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={_presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      )
    }
    // If presale started and has ended, its time for public minting
    if (presaleState && presaleEnded) {
      return (
        <button className={styles.button} onClick={_mint}>
          Public Mint 🚀
        </button>
      )
    }
  }

  return (
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <div className={styles.description}>
          Its an NFT collection for developers in Crypto.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/20 have been minted
        </div>
        <div className={styles.description}>NFT Price:0.01 ETH</div>
        <div>{renderButton()}</div>
      </div>
      <div>
        <img className={styles.image} src="./cryptodevs/0.svg" />
      </div>
    </div>
  )
}

//If the user is NOT connected to Goerli, tell them to switch to Goerli
