"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

export default function AdminLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-4 w-full py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
    >
      Logout
    </button>
  );
}
