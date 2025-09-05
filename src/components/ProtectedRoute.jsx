
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "./Ui/Loader";
import { useAuth } from "@/context/AuthContext";


export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); 
      return;
    }
    setLoading(false);
  }, [router, isAuthReady]); 

  if (loading) return <Loader />;

  return <>{children}</>;
}
