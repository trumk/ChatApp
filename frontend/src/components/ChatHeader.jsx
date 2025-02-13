import { X, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const startVideoCall = () => {
    console.log("Starting video call with", selectedUser.fullName);
    // Sau này sẽ thêm logic mở cửa sổ call
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Video Call & Close Button */}
        <div className="flex items-center gap-2">
          {/* Nút Video Call */}
          <button onClick={startVideoCall} className="hover:text-blue-500">
            <Video />
          </button>

          {/* Nút Đóng Chat */}
          <button onClick={() => setSelectedUser(null)} className="hover:text-red-500">
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;