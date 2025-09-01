
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "ChatApp - Real-time Chat",
  description: "A real-time chat application built with Next.js and Socket.IO",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#333",
                  color: "#fff",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  fontSize: "20px",
                  fontWeight: "500",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  maxWidth: "400px",
                  wordWrap: "break-word",
                },
                
                // Success toast styling
                success: {
                  duration: 3000,
                  style: {
                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  },
                  iconTheme: {
                    primary: "white",
                    secondary: "#16a34a",
                  },
                },
                
                // Error toast styling
                error: {
                  duration: 3000,
                  style: {
                    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  },
                  iconTheme: {
                    primary: "white",
                    secondary: "#dc2626",
                  },
                },
                
                // Loading toast styling
                loading: {
                  duration: 3000,
                  style: {
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                  },
                },
              }}

              containerStyle={{
                top: '20px',
                right: '20px',
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
