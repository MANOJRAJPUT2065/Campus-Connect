import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaDesktop, FaDownload, FaShare, FaExpand, FaCompress, FaRobot, FaVolumeUp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import API_CONFIG, { buildApiUrl } from '../config/api';
import { io } from 'socket.io-client';
import { useEffect as ReactUseEffect } from 'react';

const VideoCall = ({ channelName, onClose }) => {
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [agoraConfig, setAgoraConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isAIAssistOpen, setIsAIAssistOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listenLevel, setListenLevel] = useState(0);
  const recognitionRef = useRef(null);
  const listenStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // Guards to prevent duplicate init under React StrictMode/dev
  const tokenRequestedRef = useRef(false);
  const joinedOnceRef = useRef(false);
  const uidRef = useRef(null);

  // Refs for tracks and client
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const socketRef = useRef(null);

  // Get Agora configuration from backend
  useEffect(() => {
    const getAgoraConfig = async () => {
      try {
        if (tokenRequestedRef.current) return; // prevent duplicate fetch in StrictMode
        tokenRequestedRef.current = true;

        // Generate a stable UID for this component lifetime
        if (!uidRef.current) {
          uidRef.current = Math.floor(Math.random() * 100000);
        }
        const uid = uidRef.current;
        
        // Get token from backend using correct API endpoint
        const response = await fetch(buildApiUrl('/api/videocall/generate-token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName: channelName || 'default-channel',
            uid: uid.toString(),
            role: 'publisher'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAgoraConfig({
              appId: data.appId,
              token: data.token,
              channelName: data.channelName,
              uid: data.uid
            });
            console.log('✅ Agora config received:', data);
          } else {
            throw new Error(data.error || 'Failed to get Agora configuration');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Failed to get Agora config:', error);
        toast.error('Failed to initialize video call. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    getAgoraConfig();
  }, [channelName]);

  // Check camera and microphone permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check camera permission
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission(true);
        cameraStream.getTracks().forEach(track => track.stop());

        // Check microphone permission
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission(true);
        micStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Permission check failed:', error);
        if (error.name === 'NotAllowedError') {
          toast.error('Camera and microphone permissions are required for video calls');
        }
      }
    };

    checkPermissions();
  }, []);

  // Initialize browser speech recognition (if available)
  useEffect(() => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.continuous = false;
        rec.onresult = (e) => {
          const text = e.results?.[0]?.[0]?.transcript || '';
          setTranscript(text);
          setIsListening(false);
          stopLevelMonitor();
          // Auto-ask on speech end
          setTimeout(() => askAI(text), 50);
        };
        rec.onerror = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    } catch (_) {}
  }, []);

  const speak = (text) => {
    try {
      if (!speakEnabled) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1.0; u.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error('TTS error', e);
    }
  };

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    if (isListening) {
      try { rec.stop(); } catch (_) {}
      setIsListening(false);
      stopLevelMonitor();
      beep(220, 120);
    } else {
      setTranscript('');
      setIsListening(true);
      try { rec.start(); } catch (_) { setIsListening(false); }
      startLevelMonitor();
      beep(880, 120);
    }
  };

  const askAI = async (overrideText) => {
    const q = (overrideText ?? transcript).trim();
    if (!q) { toast.error('Say or type a question first'); return; }
    try {
      setAiReply('');
      setAiLoading(true);
      console.log('[AIAssist] asking:', q);
      const res = await fetch(buildApiUrl('/api/chatbot/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      let answer = data?.answer || data?.response || '';
      if (!answer) {
        answer = 'Sorry, the AI service is unavailable right now.';
      }
      if (data?.error || data?.source === 'fallback_response') {
        toast.warn('AI temporarily unavailable (provider limit). Showing fallback.');
      }
      setAiReply(answer);
      speak(answer);
      console.log('[AIAssist] reply:', answer);
    } catch (e) {
      console.error('AI ask error', e);
      toast.error('Failed to get AI response');
    }
    finally { setAiLoading(false); }
  };

  // Mic level monitor for listening feedback
  const startLevelMonitor = async () => {
    try {
      if (listenStreamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      listenStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length); // 0..~1
        setListenLevel(Math.min(1, rms * 2));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn('Level monitor failed', e);
    }
  };

  const stopLevelMonitor = () => {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(()=>{});
        audioCtxRef.current = null;
      }
      if (listenStreamRef.current) {
        listenStreamRef.current.getTracks().forEach(t => t.stop());
        listenStreamRef.current = null;
      }
      setListenLevel(0);
    } catch (_) {}
  };

  const beep = (freq, durMs) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      o.start();
      setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02); o.stop(); ctx.close(); }, durMs || 120);
    } catch (_) {}
  };

  // Initialize Agora client and join channel
  useEffect(() => {
    let init = async () => {
      if (!agoraConfig) return;
      if (joinedOnceRef.current) return; // prevent duplicate join in StrictMode

      try {
        console.log('🚀 Initializing Agora client with config:', agoraConfig);
        
        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;
        
        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          console.log('[Agora] user-published', { uid: user.uid, mediaType });
          // Ignore our own publications
          if (String(user.uid) === String(agoraConfig.uid)) {
            console.log('[Agora] skipping self-published track');
            return;
          }
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            setUsers((prevUsers) => {
              // Upsert user entry without duplication
              const exists = prevUsers.find((u) => String(u.uid) === String(user.uid));
              if (exists) {
                return prevUsers.map((u) => (String(u.uid) === String(user.uid) ? user : u));
              }
              return [...prevUsers, user];
            });
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          console.log('[Agora] user-unpublished', { uid: user.uid });
          setUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
        });

        client.on('user-left', (user) => {
          console.log('[Agora] user-left', { uid: user.uid });
          setUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        client.on('user-joined', (user) => {
          console.log('[Agora] user-joined', { uid: user.uid });
          // Participant count is derived elsewhere to avoid drift
          toast.success(`${user.uid} joined the call`);
        });

        // Create local tracks
        console.log('[Agora] creating local tracks...');
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Join the channel
        await client.join(agoraConfig.appId, agoraConfig.channelName, agoraConfig.token, agoraConfig.uid);
        console.log('[Agora] joined channel', agoraConfig.channelName);
        
        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('[Agora] published local tracks');
        
        joinedOnceRef.current = true;
        setStart(true);
        // Initialize participant count: local user + unique remote users
        setParticipantCount(1);
        toast.success('Successfully joined the video call!');

        // Connect to Socket.IO room by lecture/channel id
        try {
          if (!socketRef.current) {
            socketRef.current = io(API_CONFIG.BASE_URL, { transports: ['websocket'], withCredentials: false });
          }
          const roomId = agoraConfig.channelName;
          socketRef.current.emit('join-video-room', roomId);
          socketRef.current.on('user-joined', () => {
            setParticipantCount((prev) => prev + 1);
          });
          socketRef.current.on('user-left', () => {
            setParticipantCount((prev) => Math.max(1, prev - 1));
          });
        } catch (e) {
          console.error('[Socket] connect/join failed', e);
        }
        
      } catch (error) {
        console.error('[Agora] init failed', error);
        toast.error('Failed to join video call: ' + error.message);
      }
    };

    init();
  }, [agoraConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.leave();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
      }
      if (socketRef.current && agoraConfig?.channelName) {
        try {
          socketRef.current.emit('leave-video-room', agoraConfig.channelName);
          socketRef.current.disconnect();
        } catch (_) {}
      }
    };
  }, []);

  // Toggle mute
  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!isMuted);
      setIsMuted(!isMuted);
      toast.info(isMuted ? 'Microphone enabled' : 'Microphone muted');
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(!isVideoOff);
      setIsVideoOff(!isVideoOff);
      toast.info(isVideoOff ? 'Camera enabled' : 'Camera disabled');
    }
  };

  // Screen sharing using Agora screen video track API
  const startScreenShare = async () => {
    try {
      if (!clientRef.current || !start) {
        toast.error('Please wait for the call to connect before sharing screen');
        return;
      }

      // If a screen track already exists, stop it first
      if (screenTrack) {
        await stopScreenShare();
      }

      // Create Agora screen video track (with system audio when available)
      console.log('[Agora] creating screen video track...');
      const created = await AgoraRTC.createScreenVideoTrack({ 
        encoderConfig: '1080p_1',
        optimizationMode: 'detail'
      }, 'auto');
      
      const videoTrack = Array.isArray(created) ? created[0] : created;

      // Store reference to screen track
      setScreenTrack(videoTrack);
      setIsScreenSharing(true);
      setShowScreenOptions(false);

      // IMPORTANT: Unpublish the local camera video track before publishing screen
      if (localVideoTrackRef.current && start) {
        console.log('[Agora] unpublishing local video track for screen share');
        await clientRef.current.unpublish(localVideoTrackRef.current);
      }

      console.log('[Agora] publishing screen track');
      await clientRef.current.publish(videoTrack);
      toast.success('Screen sharing started');

      // Stop when the user ends sharing from browser UI
      const mediaTrack = videoTrack.getMediaStreamTrack();
      if (mediaTrack) {
        mediaTrack.onended = () => {
          console.log('[Agora] screen track ended');
          stopScreenShare();
          toast.info('Screen sharing stopped by user');
        };
      }
    } catch (error) {
      console.error('[Agora] start screen share error', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Screen sharing not supported in this browser');
      } else if (error.message.includes("haven't joined yet")) {
        toast.error('Please wait for the call to connect before sharing screen');
      } else {
        toast.error('Failed to start screen sharing: ' + error.message);
      }
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenTrack) {
        console.log('[Agora] unpublishing and closing screen track');
        await clientRef.current.unpublish(screenTrack);
        screenTrack.stop();
        screenTrack.close();
        setScreenTrack(null);
      }
      
      // IMPORTANT: Republish the local video track after stopping screen share
      if (localVideoTrackRef.current && clientRef.current && start) {
        console.log('[Agora] republishing local video track after screen share');
        await clientRef.current.publish(localVideoTrackRef.current);
      }
      
      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('[Agora] stop screen share error', error);
      toast.error('Failed to stop screen sharing');
    }
  };

  // Leave call
  const leaveCall = async () => {
    try {
      if (screenTrack) {
        await stopScreenShare();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      if (socketRef.current && agoraConfig?.channelName) {
        try {
          socketRef.current.emit('leave-video-room', agoraConfig.channelName);
          socketRef.current.disconnect();
        } catch (_) {}
      }
      setStart(false);
      setUsers([]);
      toast.info('Left the video call');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error leaving call:', error);
      toast.error('Error leaving call');
    }
  };

  // Local recording using MediaRecorder (downloads WEBM)
  const startRecording = () => {
    try {
      if (!localAudioTrackRef.current && !localVideoTrackRef.current && !screenTrack) {
        toast.error('Nothing to record');
        return;
      }
      const stream = new MediaStream();
      // Prefer recording screen if sharing; otherwise record camera
      if (screenTrack) {
        const m = screenTrack.getMediaStreamTrack();
        if (m) stream.addTrack(m);
      } else if (localVideoTrackRef.current) {
        const m = localVideoTrackRef.current.getMediaStreamTrack();
        if (m) stream.addTrack(m);
      }
      if (localAudioTrackRef.current) {
        const a = localAudioTrackRef.current.getMediaStreamTrack();
        if (a) stream.addTrack(a);
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      let recorder = null;
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          recorder = new MediaRecorder(stream, { mimeType: m, bitsPerSecond: 4_000_000 });
          break;
        }
      }
      if (!recorder) {
        recorder = new MediaRecorder(stream);
      }

      setRecordedChunks([]);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      recorder.onstop = () => {
        try {
          const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          a.href = url;
          a.download = `metaverse-recording-${ts}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Recording saved');
        } catch (err) {
          console.error('Save recording error', err);
          toast.error('Failed to save recording');
        }
      };
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('Recording started');
    } catch (err) {
      console.error('Start recording error', err);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
    } catch (err) {
      console.error('Stop recording error', err);
      toast.error('Failed to stop recording');
    }
  };

  // Share call link
  const shareCall = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Call link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Initializing Video Call...</h2>
          <p className="text-gray-300">Please wait while we set up your connection</p>
        </div>
      </div>
    );
  }

  // Show error state if no Agora config
  if (!agoraConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Video Call Unavailable</h2>
          <p className="text-gray-300 mb-4">
            Unable to initialize video calling. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show permission error if camera/mic not allowed
  if (!cameraPermission || !micPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-800 to-red-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Permissions Required</h2>
          <p className="text-gray-300 mb-4">
            Camera and microphone permissions are required for video calls. Please allow access and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-orange-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative">
      {isListening && (
        <div className="absolute top-20 left-4 z-40 bg-green-600 text-white px-3 py-1 rounded-full shadow animate-pulse flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-ping"></span>
          Listening...
        </div>
      )}
      {/* Simple Whiteboard overlay */}
      {isWhiteboardOpen && (
        <WhiteboardOverlay onClose={() => setIsWhiteboardOpen(false)} />
      )}
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">Video Call</h1>
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm">
              {participantCount} Participants
            </span>
          </div>
          <button
            onClick={leaveCall}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <FaPhoneSlash />
            <span>Leave Call</span>
          </button>
        </div>
      </div>

             {/* Main Video Area */}
       <div className="pt-20 pb-32 px-4">
         {start && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
             {/* Main Video Area - Show screen share when active, otherwise show local video */}
             <div className="relative bg-black rounded-lg overflow-hidden col-span-full order-first">
               {isScreenSharing && screenTrack ? (
                 // Screen Share (Main View)
                 <div
                   ref={(el) => {
                     if (el && screenTrack) {
                       screenTrack.play(el);
                     }
                   }}
                   className="w-full h-96 object-contain"
                 />
               ) : (
                 // Local Video (Main View)
                 <div
                   ref={(el) => {
                     if (el && localVideoTrackRef.current) {
                       localVideoTrackRef.current.play(el);
                     }
                   }}
                   className="w-full h-96 object-cover"
                 />
               )}
               
               {/* Screen Share Indicator */}
               {isScreenSharing && (
                 <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                   Presenting
                 </div>
               )}
               
               {/* Local Video Label */}
               <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                 {isScreenSharing ? 'Screen Share' : 'You (Local)'}
               </div>
             </div>

             {/* Small Local Video Tab (like Zoom) - Always visible */}
             <div className="relative bg-black rounded-lg overflow-hidden w-48 h-32">
               <div
                 ref={(el) => {
                   if (el && localVideoTrackRef.current) {
                     localVideoTrackRef.current.play(el);
                   }
                 }}
                 className="w-full h-full object-cover"
               />
               <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                 You
               </div>
             </div>

            {/* Remote Videos */}
            {users.map((user) => (
              <div key={user.uid} className="relative bg-black rounded-lg overflow-hidden">
                <div
                  ref={(el) => {
                    if (el && user.videoTrack) {
                      user.videoTrack.play(el);
                    }
                  }}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  User {user.uid}
                </div>
              </div>
            ))}

            {/* Remote screen rendering moved to top when active */}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`p-4 rounded-full text-white transition-colors ${
              isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </motion.button>

          {/* Video Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-full text-white transition-colors ${
              isVideoOff ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isVideoOff ? 'Enable Video' : 'Disable Video'}
          >
            {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
          </motion.button>

                     {/* Screen Share Button */}
           <div className="relative">
             <motion.button
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => setShowScreenOptions(!showScreenOptions)}
               disabled={!start}
               className={`p-4 rounded-full text-white transition-colors ${
                 isScreenSharing ? 'bg-blue-600' : 
                 !start ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'
               }`}
               title={!start ? 'Wait for call to connect' : 'Screen Share'}
             >
               <FaDesktop size={20} />
             </motion.button>

                         {/* Screen Share Options */}
             {showScreenOptions && (
               <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 space-y-1">
                 {!start ? (
                   <div className="px-3 py-2 text-gray-500 text-sm">
                     Wait for call to connect...
                   </div>
                 ) : (
                   <>
                     <button
                       onClick={startScreenShare}
                       className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                     >
                       Start Screen Share
                     </button>
                     {isScreenSharing && (
                       <button
                         onClick={stopScreenShare}
                         className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                       >
                         Stop Screen Share
                       </button>
                     )}
                   </>
                 )}
               </div>
             )}
          </div>

          {/* Recording Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full text-white transition-colors ${
              isRecording ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <FaDownload size={20} />
          </motion.button>

          {/* Whiteboard Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsWhiteboardOpen(true)}
            className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Open Whiteboard"
          >
            🖊️
          </motion.button>

          {/* Share Call Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={shareCall}
            className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Share Call Link"
          >
            <FaShare size={20} />
          </motion.button>

          {/* AI Assist */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAIAssistOpen(!isAIAssistOpen)}
            className={`p-4 rounded-full text-white transition-colors ${isAIAssistOpen ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
            title="AI Assist"
          >
            <FaRobot size={20} />
          </motion.button>

          {/* Fullscreen Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
          </motion.button>
        </div>
      </div>

      {/* AI Assist floating panel */}
      <AIAssistPanel
        open={isAIAssistOpen}
        onClose={() => setIsAIAssistOpen(false)}
        transcript={transcript}
        setTranscript={setTranscript}
        aiReply={aiReply}
        isListening={isListening}
        toggleListening={toggleListening}
        askAI={askAI}
        speakEnabled={speakEnabled}
        setSpeakEnabled={setSpeakEnabled}
        listenLevel={listenLevel}
      />
    </div>
  );
};

export default VideoCall;

// Enhanced whiteboard overlay component with shortcuts and more tools
function WhiteboardOverlay({ onClose }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'triangle' | 'arrow' | 'text'
  const [color, setColor] = useState('#22d3ee');
  const [width, setWidth] = useState(3);
  const [fillShape, setFillShape] = useState(false);
  const drawingRef = useRef(false);
  const startRef = useRef(null);
  const snapshotRef = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    // Fill white background to avoid transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (img) {
      try { ctx.putImageData(img, 0, 0); } catch (_) {}
    }
  };

  const pushUndo = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStack.current.push(data);
      // Limit stack size
      if (undoStack.current.length > 50) undoStack.current.shift();
      // Clear redo on new action
      redoStack.current = [];
    } catch (_) {}
  };

  const restoreImage = (imageData) => {
    if (!imageData) return;
    try { ctxRef.current.putImageData(imageData, 0, 0); } catch (_) {}
  };

  const beginDraw = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    drawingRef.current = true;
    startRef.current = { x, y };
    // Save snapshot for shape previews
    try { snapshotRef.current = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height); } catch (_) {}
    if (tool === 'pen' || tool === 'eraser') {
      pushUndo();
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }
  };

  const drawPreviewShape = (from, to) => {
    restoreImage(snapshotRef.current);
    const ctx = ctxRef.current;
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    
    if (tool === 'line' || tool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      if (tool === 'arrow') {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = 10 + width * 1.5;
        const hx = to.x - headLen * Math.cos(angle - Math.PI / 6);
        const hy = to.y - headLen * Math.sin(angle - Math.PI / 6);
        const hx2 = to.x - headLen * Math.cos(angle + Math.PI / 6);
        const hy2 = to.y - headLen * Math.sin(angle + Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(hx, hy);
        ctx.lineTo(hx2, hy2);
        ctx.lineTo(to.x, to.y);
        ctx.fill();
      }
    } else if (tool === 'rect') {
      const w = to.x - from.x;
      const h = to.y - from.y;
      if (fillShape) {
        ctx.fillRect(from.x, from.y, w, h);
      } else {
        ctx.strokeRect(from.x, from.y, w, h);
      }
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
      ctx.beginPath();
      ctx.arc(from.x, from.y, radius, 0, 2 * Math.PI);
      if (fillShape) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (tool === 'triangle') {
      const w = to.x - from.x;
      const h = to.y - from.y;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(from.x + w, from.y + h);
      ctx.lineTo(from.x - w, from.y + h);
      ctx.closePath();
      if (fillShape) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
  };

  const onMove = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const ctx = ctxRef.current;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'line' || tool === 'rect' || tool === 'arrow') {
      drawPreviewShape(startRef.current, { x, y });
    }
  };

  const endDraw = async (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
    const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top;
    if (tool === 'pen' || tool === 'eraser') {
      ctxRef.current.closePath();
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'arrow') {
      pushUndo();
      drawPreviewShape(startRef.current, { x, y });
      snapshotRef.current = null;
    } else if (tool === 'text') {
      const text = window.prompt('Enter text');
      if (text) {
        pushUndo();
        ctxRef.current.fillStyle = color;
        ctxRef.current.font = `${Math.max(14, width * 6)}px sans-serif`;
        ctxRef.current.fillText(text, x, y);
      }
    }
  };

  const undo = () => {
    if (!undoStack.current.length) return;
    const canvas = canvasRef.current;
    try {
      const current = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
      const prev = undoStack.current.pop();
      redoStack.current.push(current);
      restoreImage(prev);
    } catch (_) {}
  };

  const redo = () => {
    if (!redoStack.current.length) return;
    const canvas = canvasRef.current;
    try {
      const current = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
      const next = redoStack.current.pop();
      undoStack.current.push(current);
      restoreImage(next);
    } catch (_) {}
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    pushUndo();
    ctxRef.current.fillStyle = '#ffffff';
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `whiteboard-${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  ReactUseEffect(() => {
    const canvas = document.getElementById('mv-whiteboard');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    resizeCanvas();
    const c = canvas;
    c.addEventListener('mousedown', beginDraw);
    c.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', endDraw);
    c.addEventListener('touchstart', beginDraw, { passive: true });
    c.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', endDraw);
    
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            exportPng();
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'b':
            setTool('pen');
            break;
          case 'e':
            setTool('eraser');
            break;
          case 'l':
            setTool('line');
            break;
          case 'r':
            setTool('rect');
            break;
          case 'c':
            setTool('circle');
            break;
          case 't':
            setTool('triangle');
            break;
          case 'a':
            setTool('arrow');
            break;
          case 'x':
            setTool('text');
            break;
          case 'f':
            setFillShape(!fillShape);
            break;
          case 'delete':
          case 'backspace':
            clearAll();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', onResize);
      c.removeEventListener('mousedown', beginDraw);
      c.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', endDraw);
      c.removeEventListener('touchstart', beginDraw);
      c.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', endDraw);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tool, color, width, fillShape]);

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <div className="font-semibold mr-2">Whiteboard</div>
          
          {/* Drawing Tools */}
          <button onClick={() => setTool('pen')} className={`px-2 py-1 rounded ${tool==='pen'?'bg-cyan-600':'bg-gray-700'}`} title="Pen (B)">Pen</button>
          <button onClick={() => setTool('eraser')} className={`px-2 py-1 rounded ${tool==='eraser'?'bg-cyan-600':'bg-gray-700'}`} title="Eraser (E)">Eraser</button>
          <button onClick={() => setTool('line')} className={`px-2 py-1 rounded ${tool==='line'?'bg-cyan-600':'bg-gray-700'}`} title="Line (L)">Line</button>
          <button onClick={() => setTool('rect')} className={`px-2 py-1 rounded ${tool==='rect'?'bg-cyan-600':'bg-gray-700'}`} title="Rectangle (R)">Rect</button>
          <button onClick={() => setTool('circle')} className={`px-2 py-1 rounded ${tool==='circle'?'bg-cyan-600':'bg-gray-700'}`} title="Circle (C)">Circle</button>
          <button onClick={() => setTool('triangle')} className={`px-2 py-1 rounded ${tool==='triangle'?'bg-cyan-600':'bg-gray-700'}`} title="Triangle (T)">Triangle</button>
          <button onClick={() => setTool('arrow')} className={`px-2 py-1 rounded ${tool==='arrow'?'bg-cyan-600':'bg-gray-700'}`} title="Arrow (A)">Arrow</button>
          <button onClick={() => setTool('text')} className={`px-2 py-1 rounded ${tool==='text'?'bg-cyan-600':'bg-gray-700'}`} title="Text (X)">Text</button>
          
          {/* Fill Toggle */}
          <button 
            onClick={() => setFillShape(!fillShape)} 
            className={`px-2 py-1 rounded ${fillShape?'bg-green-600':'bg-gray-700'}`}
            title="Toggle Fill (F)"
          >
            {fillShape ? 'Filled' : 'Outline'}
          </button>
          
          {/* Color and Width */}
          <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="ml-2 w-8 h-8 p-0 border-0 bg-transparent" title="Color" />
          <input type="range" min="1" max="20" value={width} onChange={(e)=>setWidth(parseInt(e.target.value))} className="ml-2" title="Width" />
          
          {/* Action Buttons */}
          <button onClick={undo} className="px-2 py-1 rounded bg-gray-700" title="Undo (Ctrl+Z)">Undo</button>
          <button onClick={redo} className="px-2 py-1 rounded bg-gray-700" title="Redo (Ctrl+Y)">Redo</button>
          <button onClick={clearAll} className="px-2 py-1 rounded bg-gray-700" title="Clear (Delete)">Clear</button>
          <button onClick={exportPng} className="px-2 py-1 rounded bg-gray-700" title="Export (Ctrl+S)">Export</button>
          
          {/* Shortcuts Help */}
          <button 
            onClick={() => setShowShortcuts(!showShortcuts)} 
            className="px-2 py-1 rounded bg-blue-600 ml-2"
            title="Keyboard Shortcuts"
          >
            ⌨️
          </button>
        </div>
        <button onClick={onClose} className="px-3 py-1 bg-red-600 rounded">Close</button>
      </div>
      
      {/* Shortcuts Panel */}
      {showShortcuts && (
        <div className="bg-gray-800 text-white p-3 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Tools:</h4>
              <div>B - Pen</div>
              <div>E - Eraser</div>
              <div>L - Line</div>
              <div>R - Rectangle</div>
              <div>C - Circle</div>
              <div>T - Triangle</div>
              <div>A - Arrow</div>
              <div>X - Text</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Actions:</h4>
              <div>F - Toggle Fill</div>
              <div>Delete - Clear All</div>
              <div>Ctrl+Z - Undo</div>
              <div>Ctrl+Y - Redo</div>
              <div>Ctrl+S - Export</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Drawing:</h4>
              <div>Click & Drag - Draw</div>
              <div>Shift + Drag - Perfect shapes</div>
              <div>Double Click - Quick tool</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tips:</h4>
              <div>Use mouse wheel to zoom</div>
              <div>Right click for context</div>
              <div>Hold Shift for straight lines</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 p-2">
        <canvas id="mv-whiteboard" className="w-full h-full bg-white rounded" />
      </div>
    </div>
  );
}

// Small AI Assist panel inside the call
function AIAssistPanel({ open, onClose, transcript, setTranscript, aiReply, isListening, toggleListening, askAI, speakEnabled, setSpeakEnabled, listenLevel }) {
  if (!open) return null;
  return (
    <div className="absolute bottom-28 right-4 z-40 w-96 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white rounded-t-xl">
        <div className="flex items-center gap-2"><FaRobot /> <span className="font-semibold">AI Assist</span></div>
        <button onClick={onClose} className="text-sm px-2 py-1 bg-red-600 rounded">Close</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-gray-600">Your question</label>
          <textarea value={transcript} onChange={(e)=>setTranscript(e.target.value)} className="w-full mt-1 p-2 border rounded" rows={2} placeholder="Speak or type..." />
        </div>
        <div className="flex gap-2">
          <button onClick={toggleListening} className={`px-3 py-2 rounded text-white ${isListening?'bg-red-600':'bg-blue-600'}`}>{isListening ? 'Stop' : 'Start'} Listening</button>
          <button onClick={askAI} className="px-3 py-2 rounded text-white bg-green-600">Ask</button>
          <button onClick={()=>setSpeakEnabled(!speakEnabled)} className={`px-3 py-2 rounded text-white ${speakEnabled?'bg-indigo-600':'bg-gray-500'}`} title="Speak replies">
            <FaVolumeUp className="inline mr-1" /> {speakEnabled ? 'Voice: On' : 'Voice: Off'}
          </button>
        </div>
        {isListening && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Mic level</div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-green-500 rounded transition-all" style={{ width: `${Math.round(Math.min(100, listenLevel*100))}%` }}></div>
            </div>
          </div>
        )}
        <div>
          <label className="text-xs text-gray-600">AI reply</label>
          <div className="mt-1 p-2 border rounded bg-gray-50 min-h-[60px] text-sm text-gray-800 whitespace-pre-wrap">{aiReply || '—'}</div>
        </div>
      </div>
    </div>
  );
}
