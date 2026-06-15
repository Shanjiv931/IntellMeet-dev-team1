import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import RoomHeader from '../components/room/RoomHeader';
import VideoGrid from '../components/room/VideoGrid';
import ChatPanel from '../components/room/ChatPanel';
import ParticipantsPanel from '../components/room/ParticipantsPanel';
import AiNotesPanel from '../components/room/AiNotesPanel';
import RoomControls from '../components/room/RoomControls';
import api from '../utils/api';
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
  const [seconds, setSeconds] = useState(0); // Start at 00:00
  
  // Responsive check state
  const [isMobile, setIsMobile] = useState(false);
  
  // Chat Messages State
  const [messages, setMessages] = useState([
    { sender: "IntellMeet Bot", initials: "AI", text: `Welcome to your secure collaboration room for "${meetingTitle}". Real-time chat, screen sharing, and AI-powered transcripts are active.` }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  
  // Active socket and peer tracking references
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const peersRef = useRef({}); // WebRTC peer connections reference

  // Local media stream state and tracking reference
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);

  // Screen share stream state and reference
  const [screenStream, setScreenStream] = useState(null);
  const screenStreamRef = useRef(null);

  // Map tracking remote streams (peerId -> MediaStream)
  const [remoteStreams, setRemoteStreams] = useState({});

  // List of active peer socket IDs in the room
  const [peersList, setPeersList] = useState([]);

  // Live caption state and history logs
  const [liveCaption, setLiveCaption] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

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

  // Tick timer logic is initialized inside the socket joined-room-success handler

  // Acquire Local Video/Audio Stream Tracks on Mount
  useEffect(() => {
    let activeStream = null;

    const acquireMedia = async () => {
      try {
        console.log('Requesting local user media devices (video & audio)...');
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        console.log('Local user media successfully acquired.');
        setLocalStream(activeStream);
        localStreamRef.current = activeStream;
      } catch (err) {
        console.error('Error acquiring user media devices:', err);
        alert('Permission denied or failed to access camera/microphone. Operating in offline/avatar mode.');
      }
    };

    acquireMedia();

    // Cleanup tracks on unmount
    return () => {
      if (activeStream) {
        console.log('Stopping active stream tracks...');
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (localStreamRef.current) {
        console.log('Stopping local stream ref tracks...');
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync hardware camera track state with UI controls
  useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOff;
      }
    }
  }, [isCameraOff]);

  // Sync hardware microphone track state with UI controls
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
  }, [isMuted]);

  const handleToggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        console.log('Requesting screen capture stream...');
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        console.log('Screen capture stream acquired.');
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsSharingScreen(true);

        const screenTrack = stream.getVideoTracks()[0];

        // Replace local camera track with screen share track on all peer connections
        Object.values(peersRef.current).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Automatically toggle off screen sharing if the user stops sharing via browser overlay
        screenTrack.onended = () => {
          console.log('Screen sharing track ended natively.');
          stopScreenShare(stream);
        };

      } catch (err) {
        console.error('Failed to acquire screen capture stream:', err);
      }
    } else {
      if (screenStreamRef.current) {
        stopScreenShare(screenStreamRef.current);
      }
    }
  };

  const stopScreenShare = (stream) => {
    console.log('Stopping screen share stream...');
    stream.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsSharingScreen(false);

    // Restore webcam track on all peer connections
    const cameraTrack = localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] : null;
    if (cameraTrack) {
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      });
    }
  };

  // Initialize Web Speech API for Live Captions
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    console.log('Initializing SpeechRecognition client...');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('SpeechRecognition active and listening.');
      isListeningRef.current = true;
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalPhrase = result[0].transcript.trim();
          if (finalPhrase) {
            console.log(`Speech committed: "${finalPhrase}"`);
            setTranscriptHistory(prev => [...prev, `${safeUser.name}: ${finalPhrase}`]);
          }
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setLiveCaption(interimTranscript);
    };

    recognition.onend = () => {
      console.log('SpeechRecognition service ended.');
      isListeningRef.current = false;
      
      // Auto-restart if user has not left the meeting room
      if (socketRef.current && socketRef.current.connected) {
        try {
          console.log('Re-starting SpeechRecognition service...');
          recognition.start();
        } catch (e) {
          console.warn('Failed to restart SpeechRecognition:', e);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error encountered:', event.error);
    };

    recognitionRef.current = recognition;
    
    // Start listening
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start SpeechRecognition:', e);
    }

    return () => {
      console.log('Stopping SpeechRecognition client on unmount...');
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart loops
        recognitionRef.current.stop();
      }
    };
  }, [safeUser.name]);

  // Standard RTCPeerConnection mesh initiator
  function initializePeerConnection(peerId, isInitiator) {
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

    // Attach local stream tracks to connection
    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        pc.addTrack(track, currentStream);
      });
    }

    // Handle streams
    pc.ontrack = (event) => {
      console.log(`WebRTC stream track resolved from peer: ${peerId}`);
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: remoteStream
      }));
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
  }

  // Socket Connection and Event Listeners
  useEffect(() => {
    let socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://intellmeet-backend-5j5a.onrender.com';
    
    // Self-healing runtime URL fix for misconfigured Vercel environment variables
    if (socketUrl.includes('intellmeet-backend.onrender.com') || socketUrl.includes('intellmeet-api.onrender.com')) {
      socketUrl = socketUrl
        .replace('intellmeet-backend.onrender.com', 'intellmeet-backend-5j5a.onrender.com')
        .replace('intellmeet-api.onrender.com', 'intellmeet-backend-5j5a.onrender.com');
    }

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
      setPeersList(activePeers);
      
      // Start the meeting timer interval once joined successfully
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSeconds(prev => prev + 1);
        }, 1000);
      }

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
      setPeersList(prev => {
        if (!prev.includes(data.socketId)) {
          return [...prev, data.socketId];
        }
        return prev;
      });
    });

    socketRef.current.on('user-left', (data) => {
      console.log('Peer left signaling loop:', data.socketId);
      if (peersRef.current[data.socketId]) {
        peersRef.current[data.socketId].close();
        delete peersRef.current[data.socketId];
      }
      setPeersList(prev => prev.filter(id => id !== data.socketId));
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
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

      // Stop screen sharing tracks if active on unmount
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear the meeting timer interval on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [roomId]);
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

    // Stop screen sharing tracks if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Attempt meeting status update (Complete meeting on host leave)
    if (meeting?._id) {
      const title = meeting.title || "Instant Collaboration Sync";
      
      // Stitch together transcript logs from speech recognition history
      const localTranscriptStr = transcriptHistory.join('\n');
      const transcriptText = localTranscriptStr || `${safeUser.name}: Welcome everyone to our meeting "${title}". Let's discuss project status and next steps.`;

      api.put(`/meetings/${meeting._id}`, { 
        status: 'COMPLETED',
        transcript: transcriptText,
        endTime: new Date().toISOString()
      })
      .catch(err => console.warn('Failed to update meeting completion status', err));
    }

    onNavigate('dashboard');
  };

  return (
    <div className="room-page">
      {/* Top Header Panel */}
      <RoomHeader title={meetingTitle} seconds={seconds} roomId={roomId} />

      {/* Main Container */}
      <div className="room-main-container">
        {/* Video Area Grid */}
        <VideoGrid 
          user={safeUser} 
          isMuted={isMuted} 
          isCameraOff={isCameraOff} 
          isSharingScreen={isSharingScreen} 
          localStream={localStream}
          screenStream={screenStream}
          peersList={peersList}
          remoteStreams={remoteStreams}
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Chat ({messages.length})</span>
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'participants' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('participants')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Participants</span>
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('ainotes')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.36.59-.36.93v1.64c0 .46-.37.84-.83.84H7.66A.83.83 0 0 1 6.83 21v-1.64c0-.34-.12-.68-.36-.93A10 10 0 0 1 12 2z"/><line x1="9" y1="22" x2="15" y2="22"/></svg> AI Notes</span>
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
                      peersList={Object.keys(remoteStreams)}
                    />
                  )}
                  {activeSidebarTab === 'ainotes' && (
                    <AiNotesPanel meeting={meeting} user={safeUser} transcriptHistory={transcriptHistory} />
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Participants</span>
                    </button>
                    <button 
                      className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                      onClick={() => setActiveSidebarTab('ainotes')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.36.59-.36.93v1.64c0 .46-.37.84-.83.84H7.66A.83.83 0 0 1 6.83 21v-1.64c0-.34-.12-.68-.36-.93A10 10 0 0 1 12 2z"/><line x1="9" y1="22" x2="15" y2="22"/></svg> AI Notes</span>
                    </button>
                    <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                      ✕
                    </button>
                  </div>
                  <div className="sidebar-tab-content">
                    {activeSidebarTab === 'ainotes' ? (
                      <AiNotesPanel meeting={meeting} user={safeUser} transcriptHistory={transcriptHistory} />
                    ) : (
                      <ParticipantsPanel 
                        user={safeUser}
                        isMuted={isMuted}
                        isCameraOff={isCameraOff}
                        isSharingScreen={isSharingScreen}
                        peersList={Object.keys(remoteStreams)}
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

      {/* Live Caption Display Overlay */}
      {liveCaption && (
        <div className="live-caption-overlay">
          <span className="caption-sender">{safeUser.name}:</span>
          <span className="caption-text">{liveCaption}</span>
        </div>
      )}

      {/* Bottom Control Toolbar */}
      <RoomControls
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isCameraOff={isCameraOff}
        onToggleCamera={() => setIsCameraOff(!isCameraOff)}
        isSharingScreen={isSharingScreen}
        onToggleScreenShare={handleToggleScreenShare}
        showSidebar={showSidebar}
        activeSidebarTab={activeSidebarTab}
        onToggleSidebarPanel={handleToggleSidebarPanel}
        onLeaveMeeting={handleLeaveMeeting}
      />
    </div>
  );
}
