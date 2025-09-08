"use client";
import React, { useRef, useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Settings,
  Users,
  Maximize,
  Minimize,
  Circle,
  Square
} from "lucide-react";
import toast from "react-hot-toast";

const VideoCall = ({ roomId, onEndCall, answerOnLoad = false }) => {
  const { socket, isConnected, joinRoom, leaveRoom ,sendMessage } = useSocket();
  const { user } = useAuth();
  
  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const isEndingRef = useRef(false);
  // Ringtone
  const ringCtxRef = useRef(null);
  const ringOscRef = useRef(null);
  const ringGainRef = useRef(null);
  // Recording
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartedAtRef = useRef(null);
  // Queue for ICE candidates received before remoteDescription is set
  const pendingRemoteCandidatesRef = useRef([]);
  // Mixed audio for recording
  const mixCtxRef = useRef(null);
  const mixDestRef = useRef(null);
  
  // State management
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected
  const [remoteUser, setRemoteUser] = useState(null);
  const [pendingOffer, setPendingOffer] = useState(null);
  const [pendingVideo, setPendingVideo] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [recordings, setRecordings] = useState([]);
  
  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize peer connection
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes (RTCPeerConnection)
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      const state = peerConnection.connectionState;
      if (state === 'connected') {
        setCallStatus('connected');
      } else if (state === 'disconnected') {
        // transient; do not end immediately
        setCallStatus('connecting');
      } else if (state === 'failed' || state === 'closed') {
        handleEndCall(false);
      }
    };

    // Prefer ICE connection state for reliability
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log('ICE state:', iceState);
      if (iceState === 'connected' || iceState === 'completed') {
        setCallStatus('connected');
      } else if (iceState === 'disconnected' || iceState === 'checking') {
        setCallStatus('connecting');
      } else if (iceState === 'failed' || iceState === 'closed') {
        handleEndCall(false);
      }
    };

    return peerConnection;
  };

  // Get user media
  const getUserMedia = async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Start a call
  const startCall = async (video = true) => {
    try {
      if (!socket || !isConnected) {
        console.warn('[VideoCall] Socket not connected, cannot start call');
        return;
      }
      if (roomId && !hasJoinedRef.current) {
        console.log('[VideoCall] Ensuring room join before call', roomId);
        joinRoom(roomId);
        hasJoinedRef.current = true;
      }
      setCallStatus('calling');
      setIsVideoEnabled(video);
      
      // Get local media
      const stream = await getUserMedia(video, true);
      localStreamRef.current = stream;
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      peerConnectionRef.current = createPeerConnection();
      
      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      // Send offer to other users in room
      console.log('[VideoCall] Emitting call-offer');
      socket.emit('call-offer', {
        roomId,
        offer,
        video,
        caller: user.user.name || user.user.email
      });
      sendMessage(roomId, `${user.user.name || user.user.email} is calling...`);
      setIsInCall(true);
      
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      setCallStatus('idle');
    }
  };

  // Answer a call
 const answerCall = async (offer, video, caller) => {
  try {
    if (!offer) {
      throw new Error("Invalid call offer received.");
    }
    if (!socket || !socket.connected) {
      throw new Error("Socket is not connected.");
    }

    setCallStatus("connecting...");
    // Stop any ringing as call is being accepted
    stopRingtone();
    setRemoteUser(caller);
    setIsVideoEnabled(video);

    // ✅ 1. Get local media safely
    let stream;
    try {
      stream = await getUserMedia(video, true);
      if (!stream) throw new Error("No media stream available.");
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      throw new Error("Microphone/Camera access denied or unavailable.");
    }

    // ✅ 2. Create peer connection
    peerConnectionRef.current = createPeerConnection();
    if (!peerConnectionRef.current) {
      throw new Error("Failed to create RTCPeerConnection.");
    }

    // ✅ 3. Add local tracks
    stream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // ✅ 4. Set remote description safely
    const remoteDesc =
      typeof RTCSessionDescription !== "undefined"
        ? new RTCSessionDescription(offer)
        : offer;

    try {
      await peerConnectionRef.current.setRemoteDescription(remoteDesc);
    } catch (err) {
      throw new Error("Invalid remote description/offer.");
    }

    // ✅ 5. Create and send answer
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socket.emit("call-answer", {
      roomId,
      answer,
      caller,
    });

    sendMessage(
      roomId,
      `${user?.user?.name || user?.user?.email} is answering...`
    );

    setCallStatus("connected");
    // Ensure ringtone is stopped once connected
    stopRingtone();
    setIsInCall(true);
  } catch (error) {
    console.error("❌ Error answering call:", error);
    alert(`Could not answer call: ${error.message}`);
    setCallStatus("failed");
  }
};

  // End call
  const handleEndCall = (shouldEmit = true) => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    const hadActiveCall = isInCall;
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset state
    setIsInCall(false);
    setCallStatus('idle');
    setRemoteUser(null);
    setCallDuration(0);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    
    // Notify other users only if a call was active
    if (socket && shouldEmit && hadActiveCall) {
      socket.emit('call-end', { roomId });
    }
    
    // Call parent callback
    if (onEndCall) {
      onEndCall();
    }
    // allow future end calls
    isEndingRef.current = false;
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
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

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRingtone = () => {
  try {
    if (ringCtxRef.current) return; 

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio("/nokia-phone-ringtone-famous.mp3");
    audio.loop = true; 
    audio.preload = 'auto';

    // Connect audio element to WebAudio context
    const source = ctx.createMediaElementSource(audio);
    source.connect(ctx.destination);

    // Start playing and safely handle promise
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay or interruption errors
      });
    }

    // Store references so we can stop later
    ringCtxRef.current = ctx;
    ringOscRef.current = { audio, source, playPromise };
  } catch (err) {
    // Ignore; ringtone is non-critical
  }
};

const stopRingtone = () => {
  try {
    const holder = ringOscRef.current;
    const audio = holder?.audio;
    const playPromise = holder?.playPromise;
    const doPause = () => {
      try {
        if (audio && !audio.paused) audio.pause();
        if (audio) audio.currentTime = 0;
      } catch {}
    };
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => doPause()).catch(() => doPause());
    } else {
      doPause();
    }
    if (ringCtxRef.current) {
      try { ringCtxRef.current.close(); } catch {}
    }
  } catch {}
  ringCtxRef.current = null;
  ringOscRef.current = null;
};
  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;
    if (roomId && !hasJoinedRef.current) {
      console.log('[VideoCall] Joining room', roomId);
      joinRoom(roomId);
      hasJoinedRef.current = true;
    }

    const handleCallOffer = ({ offer, video, caller }) => {
      console.log("this function called ")
      setRemoteUser(caller);
      setPendingOffer(offer);
      setPendingVideo(!!video);
      setCallStatus('ringing');
      startRingtone();
    };

    const handleCallAnswer = async ({ answer, caller }) => {
      if (peerConnectionRef.current) {
        const remoteDesc = (typeof RTCSessionDescription !== 'undefined')
          ? new RTCSessionDescription(answer)
          : answer;
        await peerConnectionRef.current.setRemoteDescription(remoteDesc);
        // Flush any queued candidates
        if (pendingRemoteCandidatesRef.current.length > 0) {
          for (const c of pendingRemoteCandidatesRef.current) {
            try { await peerConnectionRef.current.addIceCandidate(c); } catch {}
          }
          pendingRemoteCandidatesRef.current = [];
        }
        // Show proper UI on caller side while ICE connects
        if (caller) setRemoteUser(caller);
        setCallStatus('connecting');
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!peerConnectionRef.current || !candidate) return;
      const pc = peerConnectionRef.current;
      const hasRemote = pc.remoteDescription && pc.remoteDescription.type;
      if (!hasRemote) {
        // Queue until remote description is set
        pendingRemoteCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn('Failed to add ICE candidate (will queue):', e?.message);
        pendingRemoteCandidatesRef.current.push(candidate);
      }
    };

    const handleCallEnd = () => {
      stopRingtone();
      handleEndCall(false);
    };

    const handleCallReject = () => {
      setCallStatus('idle');
      setRemoteUser(null);
      setPendingOffer(null);
      toast.error('Call was rejected');
    };

    // Register event listeners
    socket.on('call-offer', handleCallOffer);
    socket.on('call-answer', handleCallAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-end', handleCallEnd);
    socket.on('call-reject', handleCallReject);

    // Cleanup
    return () => {
      socket.off('call-offer', handleCallOffer);
      socket.off('call-answer', handleCallAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-end', handleCallEnd);
      socket.off('call-reject', handleCallReject);
      if (roomId) {
        console.log('[VideoCall] Leaving room', roomId);
        leaveRoom(roomId);
        hasJoinedRef.current = false;
      }
      stopRingtone();
    };
  }, [socket, isConnected, roomId, joinRoom, leaveRoom]);

  // Cleanup on unmount (do not emit to avoid spurious end events)
  useEffect(() => {
    return () => {
      handleEndCall(false);
      stopRingtone();
    };
  }, []);

  // If navigated from chat with stored offer, show ringing UI (no auto-answer)
  useEffect(() => {
    if (!isConnected) return;
    if (roomId && !hasJoinedRef.current) {
      console.log('[VideoCall] Prepare to answer: joining room', roomId);
      joinRoom(roomId);
      hasJoinedRef.current = true;
    }
    try {
      const raw = sessionStorage.getItem('incomingOffer');
      if (!raw) return;
      const { offer, video, caller } = JSON.parse(raw);
      console.log('[VideoCall] Offer restored from storage');
      setRemoteUser(caller);
      setPendingOffer(offer);
      setPendingVideo(!!video);
      setCallStatus('ringing');
      startRingtone();
      sessionStorage.removeItem('incomingOffer');
    } catch (e) {
      console.error('[VideoCall] Failed to restore offer:', e);
    }
  }, [isConnected, roomId, joinRoom]);

  // Recording controls
  const startRecording = () => {
    try {
      if (isRecording) return;
      const localStream = localStreamRef.current;
      const remoteStream = remoteVideoRef.current?.srcObject;
      const videoTracks = [];
      // Prefer remote video; fallback to local video
      const remoteVideoTrack = remoteStream?.getVideoTracks?.()[0];
      const localVideoTrack = localStream?.getVideoTracks?.()[0];
      if (remoteVideoTrack) videoTracks.push(remoteVideoTrack);
      else if (localVideoTrack) videoTracks.push(localVideoTrack);
      if (videoTracks.length === 0) {
        toast.error('No media tracks to record');
        return;
      }
      // Mix audio from local + remote to ensure it's present in recording
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Resume context in case it is suspended due to user gesture policies
      try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
      const dest = ctx.createMediaStreamDestination();
      try {
        if (localStream?.getAudioTracks?.().length) {
          const s = ctx.createMediaStreamSource(localStream);
          s.connect(dest);
        }
      } catch {}
      try {
        if (remoteStream?.getAudioTracks?.().length) {
          const s2 = ctx.createMediaStreamSource(remoteStream);
          s2.connect(dest);
        }
      } catch {}
      mixCtxRef.current = ctx;
      mixDestRef.current = dest;
      const mixed = new MediaStream();
      videoTracks.forEach(t => mixed.addTrack(t));
      let mixedAudio = dest.stream.getAudioTracks()[0];
      // If no mixed audio (e.g., both sides muted), at least try to add local mic track
      if (!mixedAudio && localStream?.getAudioTracks?.().length) {
        mixedAudio = localStream.getAudioTracks()[0];
      }
      if (mixedAudio) mixed.addTrack(mixedAudio);
      const mr = new MediaRecorder(mixed, { mimeType: 'video/webm;codecs=vp8,opus' });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const base64 = await blobToBase64(blob);
          const filename = `rec_${roomId}_${Date.now()}.webm`;
          const durationSec = Math.max(1, Math.floor((Date.now() - (recordingStartedAtRef.current || Date.now())) / 1000));
          const res = await fetch('/api/recordings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              filename,
              base64,
              duration: durationSec,
              startedBy: user?.user?.id,
              participants: remoteUser ? [user?.user?.email, remoteUser] : [user?.user?.email],
            })
          });
          if (res.ok) {
            const data = await res.json();
            // Refresh recordings list
            try {
              const listRes = await fetch(`/api/recordings?roomId=${roomId}`);
              if (listRes.ok) {
                const list = await listRes.json();
                setRecordings(list.recordings || []);
              }
            } catch {}
            const link = data?.path || `/recordings/${filename}`;
            toast((t) => (
              <a href={link} target="_blank" className="text-sm text-white">
                Recording saved - click to download
              </a>
            ), { duration: 5000 });
          } else {
            toast.error('Failed to save recording');
          }
        } catch (err) {
          console.error('Failed to upload recording', err);
          toast.error('Failed to save recording');
        }
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (e) {
      console.error('Error starting recording', e);
      toast.error('Recording not supported in this browser');
    }
  };

  const stopRecording = () => {
    try {
      if (!isRecording || !mediaRecorderRef.current) return;
      mediaRecorderRef.current.stop();
    } catch {}
    setIsRecording(false);
    try { mixCtxRef.current?.close(); } catch {}
    mixCtxRef.current = null;
    mixDestRef.current = null;
  };

  // Helper: safe base64 conversion without call stack overflow
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result || '';
          const comma = typeof result === 'string' ? result.indexOf(',') : -1;
          const base64 = comma >= 0 ? result.slice(comma + 1) : '';
          resolve(base64);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) { reject(e); }
  });

  // Load recordings list for the room
  useEffect(() => {
    const load = async () => {
      try {
        if (!roomId) return;
        const res = await fetch(`/api/recordings?roomId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRecordings(data.recordings || []);
        }
      } catch {}
    };
    load();
  }, [roomId, isInCall, callStatus]);

  if (!isInCall && callStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="text-center space-y-8">
          <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-16 h-16 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Start Video Call</h2>
            <p className="text-gray-300 mb-8">Connect with others in this room</p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => startCall(false)}
              className="flex items-center  cursor-pointer space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Voice Call</span>
            </button>
            
            <button
              onClick={() => startCall(true)}
              className="flex items-center cursor-pointer space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Video className="w-5 h-5" />
              <span>Video Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (callStatus === 'ringing') {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Incoming {pendingVideo ? 'Video' : 'Voice'} Call</h3>
            <p className="text-gray-500 mb-6">from {remoteUser}</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  socket.emit('call-reject', { roomId, caller: remoteUser });
                  // Stop local ringtone and reset UI immediately
                  stopRingtone();
                  setCallStatus('idle');
                  setRemoteUser(null);
                  setPendingOffer(null);
                }}
                className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => pendingOffer && answerCall(pendingOffer, pendingVideo, remoteUser)}
                className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (callStatus === 'calling') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="text-center space-y-8">
          <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Phone className="w-16 h-16 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Calling...</h2>
            <p className="text-gray-300 mb-8">Waiting for answer</p>
          </div>

          <button
            onClick={handleEndCall}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Local Video */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Call Info */}
      <div className="absolute top-4 left-4 text-white">
        <h3 className="text-xl font-semibold">{remoteUser || 'Connecting...'}</h3>
        <p className="text-sm text-gray-300">
          {callStatus === 'connected' ? formatDuration(callDuration) : callStatus}
        </p>
        {isRecording && (
          <div className="mt-2 inline-flex items-center gap-2 bg-red-600/80 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-xs">Recording...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-lg rounded-full px-6 py-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-500' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled 
                ? 'bg-gray-600 hover:bg-gray-500' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-6 h-6 text-white" />
            ) : (
              <Maximize className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>

          {/* Recording */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
              title="Stop Recording"
            >
              <Square className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-3 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
              title="Start Recording"
            >
              <Circle className="w-6 h-6 text-white" />
            </button>
          )}

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-lg rounded-lg p-4 w-64">
          <h4 className="text-white font-semibold mb-4">Call Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Microphone</span>
              <button
                onClick={toggleAudio}
                className={`px-3 py-1 rounded text-sm ${
                  isAudioEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {isAudioEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Camera</span>
              <button
                onClick={toggleVideo}
                className={`px-3 py-1 rounded text-sm ${
                  isVideoEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {isVideoEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Duration</span>
              <span className="text-gray-400">{formatDuration(callDuration)}</span>
            </div>
            <div className="pt-3 border-t border-white/10">
              <h5 className="text-white font-semibold mb-2">Recordings</h5>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {recordings.length === 0 ? (
                  <span className="text-gray-400 text-sm">No recordings yet</span>
                ) : (
                  recordings.map(r => (
                    <a key={r.id} href={r.path} target="_blank" className="block text-xs text-blue-300 hover:text-blue-200 underline">
                      {r.filename} ({r.duration_sec || 0}s)
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
