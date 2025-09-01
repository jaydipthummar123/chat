
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "./Ui/Loader";


export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); 
    } else {
      setLoading(false);
    }
  }, [router]); 

  if (loading) return <Loader />;

  return <>{children}</>;
}
