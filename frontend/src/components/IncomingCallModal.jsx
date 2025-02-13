import { useVideoCallStore } from "../store/useVideoCallStore";

const IncomingCallModal = () => {
  const { isReceivingCall, incomingCallData, acceptCall, declineCall } = useVideoCallStore();

  if (!isReceivingCall || !incomingCallData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-xl font-semibold">Incoming Call</h2>
        <p className="text-gray-700 mt-2">From: {incomingCallData.callerId}</p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={acceptCall}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Accept
          </button>
          <button
            onClick={declineCall}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;