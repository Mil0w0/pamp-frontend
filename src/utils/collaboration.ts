import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export interface CollaborationUser {
  name: string
  color: string
  id: string
  isOnline?: boolean
}

export interface CollaborationConfig {
  documentId: string
  user: CollaborationUser
  awareness?: boolean
}

export class CollaborationManager {
  private doc: Y.Doc
  private provider: WebrtcProvider
  private documentId: string
  private user: CollaborationUser

  constructor(config: CollaborationConfig) {
    this.documentId = config.documentId
    this.user = config.user
    
    // Create Yjs document
    this.doc = new Y.Doc()
    
    // Create WebRTC provider for real-time sync
    this.provider = new WebrtcProvider(this.documentId, this.doc, {
      signaling: ['wss://y-webrtc-signaling-us.herokuapp.com', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
      maxConns: 20,
      filterBcConns: true,
      peerOpts: {}
    })

    // Set user awareness information
    this.provider.awareness.setLocalStateField('user', {
      name: this.user.name,
      color: this.user.color,
      id: this.user.id,
    })
  }

  getDocument(): Y.Doc {
    return this.doc
  }

  getProvider(): WebrtcProvider {
    return this.provider
  }

  getFragment(fragmentName: string): Y.XmlFragment {
    return this.doc.getXmlFragment(fragmentName)
  }

  onAwarenessChange(callback: (users: CollaborationUser[]) => void) {
    this.provider.awareness.on('change', () => {
      const users: CollaborationUser[] = []
      this.provider.awareness.getStates().forEach((state, clientId) => {
        if (state.user && clientId !== this.provider.awareness.clientID) {
          users.push({
            ...state.user,
            isOnline: true,
          })
        }
      })
      callback(users)
    })
  }

  onConnectionStatusChange(callback: (connected: boolean, userCount: number) => void) {
    const updateStatus = () => {
      const connected = this.provider.connected
      const userCount = this.provider.awareness.getStates().size
      callback(connected, userCount)
    }

    this.provider.on('status', updateStatus)
    this.provider.awareness.on('change', updateStatus)
    
    // Initial call
    updateStatus()
  }

  destroy() {
    this.provider.destroy()
    this.doc.destroy()
  }
}

// Generate random user colors
const COLLABORATION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#FF7F50', '#87CEEB', '#FFB6C1', '#98FB98',
  '#F0E68C', '#FFA07A', '#20B2AA', '#87CEFA', '#DDA0DD'
]

export function generateUserColor(): string {
  return COLLABORATION_COLORS[Math.floor(Math.random() * COLLABORATION_COLORS.length)]
}

export function generateUserId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function generateUserName(): string {
  const adjectives = ['Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Energetic', 'Fantastic', 'Genius', 'Happy', 'Incredible', 'Joyful']
  const nouns = ['Writer', 'Editor', 'Student', 'Scholar', 'Learner', 'Thinker', 'Creator', 'Author', 'Researcher', 'Developer']
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 100)
  
  return `${adjective} ${noun} ${number}`
} 