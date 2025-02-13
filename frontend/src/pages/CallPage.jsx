import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; 
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
const socket = io(BASE_URL);

const CallPage = () => {
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    console.log("Đang gọi đến user có ID:", targetUserId);

    const startCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        socket.emit("call-user", { targetUserId });

        peerConnection.current = new RTCPeerConnection();
        localStream.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        socket.on("incoming-call", ({ from }) => {
          console.log("Cuộc gọi đến từ:", from);
        });

        socket.on("answer-call", async ({ answer }) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

      } catch (error) {
        console.error("Lỗi truy cập camera/mic:", error);
        navigate("/");
      }
    };

    startCall();

    return () => {
      socket.off("incoming-call");
      socket.off("answer-call");
    };
  }, [navigate, targetUserId]);

  const toggleMic = () => {
    const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  };

  const endCall = () => {
    socket.emit("end-call", { targetUserId });
    peerConnection.current.close();
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 relative">
      <div className="flex justify-center gap-5">
        <video ref={localVideoRef} autoPlay playsInline className="w-1/2 border rounded" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border rounded" />
      </div>

      <div className="absolute bottom-5 flex gap-4">
        <button onClick={toggleMic} className="bg-gray-800 p-3 rounded-full text-white">
          {micOn ? <Mic /> : <MicOff />}
        </button>
        <button onClick={toggleCamera} className="bg-gray-800 p-3 rounded-full text-white">
          {cameraOn ? <Video /> : <VideoOff />}
        </button>
        <button onClick={endCall} className="bg-red-600 p-3 rounded-full text-white">
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default CallPage;
