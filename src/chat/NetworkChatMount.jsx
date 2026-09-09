import { useMemo } from 'react'
import ChatWidget from './core/ChatWidget.jsx'
import { createNetworkAdapter } from './networkAdapter.js'

const NETWORK_THEME = {
  primary: '#00d4ff',
  background: '#0f1117',
  surface: '#131720',
  surfaceRaised: '#1a2035',
  text: '#e2e8f0',
  muted: '#8b94a7',
  border: '#263044',
  shadow: '0 22px 70px rgba(0,0,0,.5)',
}

export default function NetworkChatMount() {
  const adapter = useMemo(() => createNetworkAdapter(), [])
  return <ChatWidget adapter={adapter} theme={NETWORK_THEME} />
}
