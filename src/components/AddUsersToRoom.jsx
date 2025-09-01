// import { useAuth } from "@/context/AuthContext";
// import React, { useEffect, useState } from "react";

// const AddUsersToRoom = ({ roomId, currentUserId }) => {
//   const [users, setUsers] = useState([]);
//   const [selectedUserIds, setSelectedUserIds] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [open, setOpen] = useState(false);

//   const { token } = useAuth();

//   useEffect(() => {
//     if (!open) return;
//     const fetchUsers = async () => {
//       try {
//         const res = await fetch("/api/auth/register", { method: "GET" });
//         const data = await res.json();
//         if (data.users) {
//           setUsers(data.users.filter((u) => u.id !== currentUserId));
//         }
//       } catch (err) {
//         setMessage("Failed to fetch users");
//       }
//     };
//     fetchUsers();
//   }, [currentUserId, open]);

//   const handleSelect = (e) => {
//     const options = Array.from(e.target.selectedOptions);
//     setSelectedUserIds(options.map((opt) => opt.value));
//   };

//   const handleAddUsers = async () => {
//     setLoading(true);
//     setMessage("");
//     try {
//       const res = await fetch("/api/rooms", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ roomId, userIds: selectedUserIds }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setMessage("✅ Users added successfully!");
//         setSelectedUserIds([]);
//         setTimeout(() => setOpen(false), 1000); // close after success
//       } else {
//         setMessage(data.error || "❌ Failed to add users");
//       }
//     } catch (err) {
//       setMessage("⚠️ Error adding users");
//     }
//     setLoading(false);
//   };

//   return (
//     <div>
//       {/* Trigger Button */}
//       <button
//         onClick={() => setOpen(true)}
//         className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
//       >
//         ➕ Add Users
//       </button>

//       {/* Popup Modal (No motion.div, only Tailwind) */}
//       {open && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
//           <div
//             className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-96 transform transition-all duration-300 scale-95 opacity-0
//               ${open ? "scale-100 opacity-100" : ""}`}
//           >
//             <h3 className="text-lg font-semibold mb-2">Add Users to Room</h3>
//             {message && (
//               <p
//                 className={`text-sm mb-2 ${
//                   message.includes("✅") ? "text-green-500" : "text-red-500"
//                 }`}
//               >
//                 {message}
//               </p>
//             )}

//             <select
//               multiple
//               value={selectedUserIds}
//               onChange={handleSelect}
//               className="w-full border p-2 rounded mb-3 dark:bg-slate-700"
//             >
//               {users.map((user) => (
//                 <option key={user.id} value={user.id}>
//                   {user.name} ({user.email})
//                 </option>
//               ))}
//             </select>

//             <div className="flex justify-between gap-3">
//               <button
//                 onClick={handleAddUsers}
//                 disabled={loading || selectedUserIds.length === 0}
//                 className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
//               >
//                 {loading ? "Adding..." : "Add Selected"}
//               </button>
//               <button
//                 onClick={() => setOpen(false)}
//                 className="flex-1 bg-gray-300 dark:bg-slate-600 text-black dark:text-white p-2 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddUsersToRoom;
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AddUsersToRoom = ({ roomId, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/auth/register", { method: "GET" });
        const data = await res.json();
        if (data.users) {
          setUsers(data.users.filter((u) => u.id !== currentUserId));
        }
      } catch (err) {
        setMessage("Failed to fetch users");
      }
    };
    fetchUsers();
  }, [currentUserId, open]);

  const handleOpen = () => {
    setOpen(true);
    setIsAnimating(true);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setOpen(false);
      setMessage("");
      setSelectedUserIds([]);
    }, 300);
  };

  const handleSelect = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedUserIds(options.map((opt) => opt.value));
  };

  const handleAddUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/rooms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, userIds: selectedUserIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Users added successfully!");
        toast.success("Users added successfully!");
        setSelectedUserIds([]);
        setTimeout(() => handleClose(), 1500);
      } else {
        setMessage(data.error || "❌ Failed to add users");
        toast.error(data.error || "Failed to add users");
      }
    } catch (err) {
      setMessage("⚠️ Error adding users");
      toast.error("Error adding users");
    }
    setLoading(false);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div>
      {/* Enhanced Trigger Button */}
      <button
        onClick={handleOpen}
        className="group relative  cursor-pointer px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium
                   hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg 
                   transform transition-all duration-200 ease-out
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   active:scale-95"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg group-hover:rotate-12 transition-transform duration-200">
            ➕
          </span>
          Add Users
        </span>
      </button>

      {/* Enhanced Modal with Backdrop Animation */}
      {open && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-50  bottom-[-470px] px-4
                     transition-all duration-300 ease-out
                     ${
                       isAnimating
                         ? "bg-black/60 backdrop-blur-sm"
                         : "bg-black/0 backdrop-blur-0"
                     }`}
          onClick={handleClose}
        >
          {/* Modal Container with Enhanced Animation */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md
                       border border-slate-200 dark:border-slate-700
                       transform transition-all duration-300 ease-out
                       ${
                         isAnimating
                           ? "scale-100 opacity-100 translate-y-0"
                           : "scale-95 opacity-0 translate-y-4"
                       }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-500">👥</span>
                  Add Users to Room
                </h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 
                           transition-colors duration-200 group"
                >
                  <span className="block w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 text-xl">
                    ×
                  </span>
                </button>
              </div>
              {message && (
                <div
                  className={`mt-3 p-3 rounded-lg text-sm font-medium animate-pulse
                  ${
                    message.includes("✅")
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Select users to add ({selectedUserIds.length} selected)
                </label>

                {/* Custom User Selection List */}
                <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No users available to add
                    </div>
                  ) : (
                    users.map((user, index) => (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={`p-4 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0
                                   transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 animate-in slide-in-from-bottom-2
                                   ${
                                     selectedUserIds.includes(user.id)
                                       ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                                       : "hover:border-l-4 hover:border-l-blue-200 dark:hover:border-l-blue-400"
                                   }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                                         ${
                                           selectedUserIds.includes(user.id)
                                             ? "bg-blue-500 border-blue-500 scale-110"
                                             : "border-slate-300 dark:border-slate-600 hover:border-blue-400"
                                         }`}
                          >
                            {selectedUserIds.includes(user.id) && (
                              <span className="text-white text-xs animate-pulse">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddUsers}
                  disabled={loading || selectedUserIds.length === 0}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 
                             transform hover:scale-[1.02] active:scale-[0.98]
                             focus:outline-none focus:ring-2 focus:ring-offset-2
                             ${
                               loading || selectedUserIds.length === 0
                                 ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                 : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500"
                             }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    `Add ${selectedUserIds.length} User${
                      selectedUserIds.length !== 1 ? "s" : ""
                    }`
                  )}
                </button>

                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm
                           bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300
                           hover:bg-slate-200 dark:hover:bg-slate-600 
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUsersToRoom;
