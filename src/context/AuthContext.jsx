"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // ✅ user state add
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken); // ✅ user fetch karo
    }
  }, []);

  const fetchUser = async (jwt) => {
    try {
      const res = await fetch("http://localhost:3000/api/users/me", {
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
  };

  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
    fetchUser(jwt); // ✅ fetch user on login
    router.push("/chat");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null); 
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
