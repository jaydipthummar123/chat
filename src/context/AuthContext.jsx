"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // ✅ user state add
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken); 
    } else {
      setIsAuthReady(true);
    }
  }, []);

  const fetchUser = async (jwt) => {
    try {
      const res = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data); // ✅ save user info
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    }
    setIsAuthReady(true);
  };

  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
    fetchUser(jwt); // ✅ fetch user on login
    setIsAuthReady(true);
    router.push("/chat");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null); 
    setIsAuthReady(true);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
