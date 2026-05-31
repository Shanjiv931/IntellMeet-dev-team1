import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import RoomHeader from '../components/room/RoomHeader';
import VideoGrid from '../components/room/VideoGrid';
import ChatPanel from '../components/room/ChatPanel';
import ParticipantsPanel from '../components/room/ParticipantsPanel';
import AiNotesPanel from '../components/room/AiNotesPanel';
import RoomControls from '../components/room/RoomControls';
import './Room.css';

export default function Room({ onNavigate, user, meeting }) {
  const safeUser = user || { name: "Guest User", role: "Guest", avatar: "GU" };
  const roomId = meeting?._id || meeting?.id || 'default-room';
  const meetingTitle = meeting?.title || "Q3 Strategy Planning";

  // Toolbar and Meeting States
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('participants'); // 'chat', 'participants', or 'ainotes'
  
  // Timer State
  const [seconds, setSeconds] = useState(942); // Start at 15 mins 42 secs
  
  // Responsive check state
  const [isMobile, setIsMobile] = useState(false);
  
  // Chat Messages State
  const [messages, setMessages] = useState([
    { sender: "Tech Lead", initials: "TL", text: "Let's review Q3 product release endpoints." },
    { sender: "QA Lead", initials: "QA", text: "Testing schedules look good. We are ready." }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  
  // Active socket and peer tracking references
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const peersRef = useRef({}); // WebRTC peer connections reference

  // Responsive Layout detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && activeSidebarTab === 'chat') {
        setActiveSidebarTab('participants');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeSidebarTab]);

  // Tick timer every second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://intellmeet-backend-5j5a.onrender.com';
    console.log(`Connecting to WebSocket Server: ${socketUrl} for room ${roomId}`);
    
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Handle connection success
    socketRef.current.on('connect', () => {
      console.log('Connected to socket signaling server. Socket ID:', socketRef.current.id);
      
      // Join Room
      socketRef.current.emit('join-room', roomId);
    });

    // Handle Room joined confirmation
    socketRef.current.on('joined-room-success', ({ roomId, activePeers }) => {
      console.log(`Successfully entered socket room: ${roomId}. Active peers in room:`, activePeers);
      
      // In-mesh WebRTC: Initiate peer connection objects to each active peer in room
      activePeers.forEach(peerId => {
        initializePeerConnection(peerId, true);
      });
    });

    // Sync incoming real-time chat messages
    socketRef.current.on('room-message', (data) => {
      console.log('New message received from socket:', data);
      const senderInitials = data.senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      
      // Avoid duplicating locally sent messages
      if (data.senderId !== socketRef.current.id) {
        setMessages(prev => [
          ...prev,
          { 
            sender: data.senderName, 
            initials: senderInitials || "U", 
            text: data.message 
          }
        ]);
      }
    });

    // WebRTC signaling handshakes
    socketRef.current.on('webrtc-offer', async ({ senderId, offer }) => {
      console.log(`Received WebRTC SDP offer from peer: ${senderId}`);
      const pc = initializePeerConnection(senderId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socketRef.current.emit('webrtc-answer', { targetId: senderId, answer });
      } catch (err) {
        console.error('Failed to process incoming SDP offer:', err);
      }
    });

    socketRef.current.on('webrtc-answer', async ({ senderId, answer }) => {
      console.log(`Received WebRTC SDP answer from peer: ${senderId}`);
      const pc = peersRef.current[senderId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Failed to set remote SDP answer description:', err);
        }
      }
    });

    socketRef.current.on('webrtc-candidate', async ({ senderId, candidate }) => {
      console.log(`Received WebRTC ICE candidate from peer: ${senderId}`);
      const pc = peersRef.current[senderId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add WebRTC ICE candidate:', err);
        }
      }
    });

    // Handle peer joins/disconnects
    socketRef.current.on('user-joined', (data) => {
      console.log('Peer joined signaling loop:', data.socketId);
    });

    socketRef.current.on('user-left', (data) => {
      console.log('Peer left signaling loop:', data.socketId);
      if (peersRef.current[data.socketId]) {
        peersRef.current[data.socketId].close();
        delete peersRef.current[data.socketId];
      }
    });

    // Sync peer media changes (camera/mute/share states)
    socketRef.current.on('peer-media-toggled', (data) => {
      console.log(`Peer media changed. Client: ${data.senderId}`, data);
      // Synchronizes presence/indicator states dynamically inside current grids
    });

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket signaling link.');
        socketRef.current.emit('leave-room', roomId);
        socketRef.current.disconnect();
      }
      // Close all WebRTC connections on leave
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, [roomId]);

  // Standard RTCPeerConnection mesh initiator
  const initializePeerConnection = (peerId, isInitiator) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId];

    console.log(`Initializing RTCPeerConnection for peer: ${peerId}. Initiator: ${isInitiator}`);
    
    // Standard STUN/TURN configurations
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19002' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-candidate', {
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle streams
    pc.ontrack = (event) => {
      console.log(`WebRTC stream track resolved from peer: ${peerId}`);
    };

    peersRef.current[peerId] = pc;

    // Send SDP Offer if initiator
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit('webrtc-offer', { targetId: peerId, offer });
        } catch (err) {
          console.error('Failed to create SDP offer negotiating:', err);
        }
      };
    }

    return pc;
  };

  // Sync client control button toggles with socket channel
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('peer-media-toggle', {
        roomId,
        isMuted,
        isCameraOff,
        isSharingScreen
      });
    }
  }, [isMuted, isCameraOff, isSharingScreen, roomId]);

  // Auto-scroll chat on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSidebar]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const payload = {
      roomId,
      message: inputMsg,
      senderName: safeUser.name
    };

    // Send via socket gateway
    if (socketRef.current) {
      socketRef.current.emit('message', payload);
    }

    // Append locally immediately
    setMessages(prev => [
      ...prev,
      { sender: safeUser.name, initials: safeUser.avatar, text: inputMsg }
    ]);
    
    setInputMsg('');
  };

  const handleToggleSidebarPanel = (panelName) => {
    if (showSidebar && activeSidebarTab === panelName) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
      setActiveSidebarTab(panelName);
    }
  };

  const handleLeaveMeeting = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Attempt meeting status update (Complete meeting on host leave)
    if (meeting?._id) {
      api.put(`/meetings/${meeting._id}`, { status: 'COMPLETED' })
        .catch(err => console.warn('Failed to update meeting completion status', err));
    }

    onNavigate('dashboard');
  };

  return (
    <div className="room-page">
      {/* Top Header Panel */}
      <RoomHeader title={meetingTitle} seconds={seconds} />

      {/* Main Container */}
      <div className="room-main-container">
        {/* Video Area Grid */}
        <VideoGrid 
          user={safeUser} 
          isMuted={isMuted} 
          isCameraOff={isCameraOff} 
          isSharingScreen={isSharingScreen} 
        />

        {/* Right Sidebar Panel */}
        {showSidebar && (
          <aside className="room-sidebar">
            {isMobile ? (
              /* Mobile Layout: Single view at a time using 3 tabs */
              <div className="sidebar-mobile-layout">
                <div className="sidebar-tab-header">
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('chat')}
                  >
                    💬 Chat ({messages.length})
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'participants' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('participants')}
                  >
                    👥 Participants
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('ainotes')}
                  >
                    🤖 AI Notes
                  </button>
                  <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                    ✕
                  </button>
                </div>
                
                <div className="sidebar-tab-content">
                  {activeSidebarTab === 'chat' && (
                    <ChatPanel 
                      messages={messages}
                      inputMsg={inputMsg}
                      setInputMsg={setInputMsg}
                      handleSendChat={handleSendChat}
                      chatEndRef={chatEndRef}
                      currentUserInitials={safeUser.avatar}
                    />
                  )}
                  {activeSidebarTab === 'participants' && (
                    <ParticipantsPanel 
                      user={safeUser}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      isSharingScreen={isSharingScreen}
                    />
                  )}
                  {activeSidebarTab === 'ainotes' && (
                    <AiNotesPanel />
                  )}
                </div>
              </div>
            ) : (
              /* Desktop Layout: Split view. Top (Participants OR AI Notes), Bottom (Chat always accessible) */
              <div className="sidebar-desktop-layout">
                <div className="sidebar-top-section">
                  <div className="sidebar-tab-header">
                    <button 
                      className={`tab-toggle-btn ${activeSidebarTab === 'participants' ? 'active' : ''}`}
                      onClick={() => setActiveSidebarTab('participants')}
                    >
                      👥 Participants
                    </button>
                    <button 
                      className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                      onClick={() => setActiveSidebarTab('ainotes')}
                    >
                      🤖 AI Notes
                    </button>
                    <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                      ✕
                    </button>
                  </div>
                  <div className="sidebar-tab-content">
                    {activeSidebarTab === 'ainotes' ? (
                      <AiNotesPanel />
                    ) : (
                      <ParticipantsPanel 
                        user={safeUser}
                        isMuted={isMuted}
                        isCameraOff={isCameraOff}
                        isSharingScreen={isSharingScreen}
                      />
                    )}
                  </div>
                </div>

                <div className="sidebar-bottom-section">
                  <ChatPanel 
                    messages={messages}
                    inputMsg={inputMsg}
                    setInputMsg={setInputMsg}
                    handleSendChat={handleSendChat}
                    chatEndRef={chatEndRef}
                    currentUserInitials={safeUser.avatar}
                  />
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Control Toolbar */}
      <RoomControls
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isCameraOff={isCameraOff}
        onToggleCamera={() => setIsCameraOff(!isCameraOff)}
        isSharingScreen={isSharingScreen}
        onToggleScreenShare={() => setIsSharingScreen(!isSharingScreen)}
        showSidebar={showSidebar}
        activeSidebarTab={activeSidebarTab}
        onToggleSidebarPanel={handleToggleSidebarPanel}
        onLeaveMeeting={handleLeaveMeeting}
      />
    </div>
  );
}
