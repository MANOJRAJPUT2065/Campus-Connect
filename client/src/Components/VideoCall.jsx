import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaDesktop, FaDownload, FaShare, FaExpand, FaCompress } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const VideoCall = ({ channelName, onClose }) => {
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [agoraConfig, setAgoraConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for tracks and client
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  // Get Agora configuration from backend
  useEffect(() => {
    const getAgoraConfig = async () => {
      try {
        // Generate a unique UID for this user
        const uid = Math.floor(Math.random() * 100000);
        
        // Get token from backend
        const response = await fetch('http://localhost:5000/api/videocall/generate-token', {
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

  // Initialize Agora client and join channel
  useEffect(() => {
    let init = async () => {
      if (!agoraConfig) return;

      try {
        console.log('🚀 Initializing Agora client with config:', agoraConfig);
        
        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;
        
        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          console.log('👤 User published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setUsers((prevUsers) => {
              if (prevUsers.find(u => u.uid === user.uid)) return prevUsers;
              return [...prevUsers, user];
            });
          }
          
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          console.log('👤 User unpublished:', user.uid);
          setUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
        });

        client.on('user-left', (user) => {
          console.log('👤 User left:', user.uid);
          setUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        client.on('user-joined', (user) => {
          console.log('👤 User joined:', user.uid);
          setParticipantCount(prev => prev + 1);
          toast.success(`${user.uid} joined the call`);
        });

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Join the channel
        await client.join(agoraConfig.appId, agoraConfig.channelName, agoraConfig.token, agoraConfig.uid);
        console.log('✅ Successfully joined channel:', agoraConfig.channelName);
        
        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('✅ Published local tracks');
        
        setStart(true);
        toast.success('Successfully joined the video call!');
        
      } catch (error) {
        console.error('❌ Failed to initialize video call:', error);
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

  // Enhanced screen sharing with multiple options
  const startScreenShare = async (sourceType = 'screen') => {
    try {
      let constraints = {};
      if (sourceType === 'screen') {
        constraints = { video: { mediaSource: 'screen', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } } };
      } else if (sourceType === 'window') {
        constraints = { video: { mediaSource: 'window', width: { ideal: 1920 }, height: { ideal: 1080 } } };
      } else if (sourceType === 'application') {
        constraints = { video: { mediaSource: 'application', width: { ideal: 1920 }, height: { ideal: 1080 } } };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      const newScreenTrack = stream.getVideoTracks()[0];

      if (screenTrack) {
        screenTrack.close();
        await clientRef.current.unpublish(screenTrack);
      }
      await clientRef.current.publish(newScreenTrack);
      setScreenTrack(newScreenTrack);
      setIsScreenSharing(true);
      setShowScreenOptions(false);
      toast.success(`Screen sharing started (${sourceType})`);
      newScreenTrack.onended = () => {
        stopScreenShare();
        toast.info('Screen sharing stopped by user');
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else {
        toast.error('Failed to start screen sharing');
      }
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenTrack) {
        await clientRef.current.unpublish(screenTrack);
        screenTrack.close();
        setScreenTrack(null);
      }
      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
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
      setStart(false);
      setUsers([]);
      toast.info('Left the video call');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error leaving call:', error);
      toast.error('Error leaving call');
    }
  };

  // Mock recording functions
  const startRecording = () => {
    setIsRecording(true);
    toast.info('Recording started (mock)');
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.info('Recording stopped (mock)');
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
            {/* Local Video */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div
                ref={(el) => {
                  if (el && localVideoTrackRef.current) {
                    localVideoTrackRef.current.play(el);
                  }
                }}
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You (Local)
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

            {/* Screen Share Video */}
            {isScreenSharing && screenTrack && (
              <div className="relative bg-black rounded-lg overflow-hidden col-span-full">
                <video
                  ref={(el) => {
                    if (el) el.srcObject = new MediaStream([screenTrack]);
                  }}
                  autoPlay
                  className="w-full h-96 object-contain"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                  Screen Sharing
                </div>
              </div>
            )}
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
              className={`p-4 rounded-full text-white transition-colors ${
                isScreenSharing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
              }`}
              title="Screen Share"
            >
              <FaDesktop size={20} />
            </motion.button>

            {/* Screen Share Options */}
            {showScreenOptions && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 space-y-1">
                <button
                  onClick={() => startScreenShare('screen')}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                >
                  Share Entire Screen
                </button>
                <button
                  onClick={() => startScreenShare('window')}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                >
                  Share Application Window
                </button>
                <button
                  onClick={() => startScreenShare('application')}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-gray-800"
                >
                  Share Application Tab
                </button>
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
    </div>
  );
};

export default VideoCall;
