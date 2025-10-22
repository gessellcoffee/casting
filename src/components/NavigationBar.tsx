"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import NotificationsDropdown from "./NotificationsDropdown";
import { GrClose } from "react-icons/gr";
import { GiHamburgerMenu } from "react-icons/gi";
import { supabase, signOut, getUser } from "@/lib/supabase";
import { getProfile } from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";

type NavigationBarProps = {
  logoSrc?: string;
  onLogout?: () => void | Promise<void>;
};

export default function NavigationBar() {
      const [showMenu, setShowMenu] = useState(false);
      const [user, setUser] = useState<any>(null);
      const [profile, setProfile] = useState<Profile | null>(null);
      const router = useRouter();

      useEffect(() => {
        // Get initial user
        getUser().then(setUser).catch(() => setUser(null));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      }, []);

      useEffect(() => {
        // Fetch user profile when user changes
        if (user?.id) {
          getProfile(user.id).then(setProfile).catch(() => setProfile(null));
        } else {
          setProfile(null);
        }
      }, [user]);

      const handleSignOut = async () => {
        await signOut();
        router.push('/');
        router.refresh();
      };

  return(
<header className="neumorphic-header">
<nav id="desktop-menu" className="hidden sm:flex items-center justify-between w-full">
      <div className="logo">
        <Link href="/">Belong Here Theater</Link>
  </div>
  <div className="nav-buttons flex-1 flex justify-center gap-4">
    {user && (
      <>
        <Button text="Audition" href="/auditions" />
        <Button text="Cast" href="/cast" />
        <Button text="Shows" href="/shows" />
        <Button text="Company" href="/company" />
      </>
    )}
  </div>
  <div className="flex items-center gap-4">
    {user && <NotificationsDropdown userId={user.id} />}
    {user ? (
      <>
      <Link href='/my-auditions'>
        <span className='text-[#b5ccff] hover:text-[#5a8ff5] transition-colors text-sm'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path d="M12 11.993a.75.75 0 0 0-.75.75v.006c0 .414.336.75.75.75h.006a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75H12ZM12 16.494a.75.75 0 0 0-.75.75v.005c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H12ZM8.999 17.244a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.006ZM7.499 16.494a.75.75 0 0 0-.75.75v.005c0 .414.336.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H7.5ZM13.499 14.997a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.005a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.005ZM14.25 16.494a.75.75 0 0 0-.75.75v.006c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75h-.005ZM15.75 14.995a.75.75 0 0 1 .75-.75h.005a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75H16.5a.75.75 0 0 1-.75-.75v-.006ZM13.498 12.743a.75.75 0 0 1 .75-.75h2.25a.75.75 0 1 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75ZM6.748 14.993a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" />
  <path fill-rule="evenodd" d="M18 2.993a.75.75 0 0 0-1.5 0v1.5h-9V2.994a.75.75 0 1 0-1.5 0v1.497h-.752a3 3 0 0 0-3 3v11.252a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3V7.492a3 3 0 0 0-3-3H18V2.993ZM3.748 18.743v-7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5Z" clip-rule="evenodd" />
</svg>
</span>
      </Link>
        <Link href="/profile">
          <div className="avatar">
            <img className="rounded-full" src={profile?.profile_photo_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/50"} alt="Avatar"/>
          </div>
        </Link>
        <button 
          onClick={handleSignOut}
          className="text-[#b5ccff] hover:text-[#5a8ff5] transition-colors text-sm"
        >
          Sign Out
        </button>
      </>
    ) : (
      <Button text="Login" href="/login" />
    )}
  </div>
</nav>
  <nav className="sm:hidden flex items-center justify-between w-full gap-1 font-semibold">
    <div className="logo">
    BHT
    </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="sm:hidden text-center font-bold     text-xl hover:text-gray-500"
        >
          {showMenu ? <GrClose /> : <GiHamburgerMenu />}
        </button>
        {showMenu && (
          <div className="nav-buttons  flex-1 flex flex-col justify-center gap-2 absolute top-16 left-0 right-0 bg-gradient-to-br from-[#2e3e5e]/95 to-[#26364e]/95 p-4 rounded-2xl mx-4 backdrop-blur-lg border border-[#4a7bd9]/20">
            {user ? (
              <>
                <Button text="Audition" href="/auditions" />
                <Button text="My Auditions" href="/my-auditions" />
                <Button text="Cast" href="/cast" />
                <Button text="Shows" href="/shows" />
                <Button text="Company" href="/company" />
                <button 
                  onClick={handleSignOut}
                  className="text-[#b5ccff] hover:text-[#5a8ff5] transition-colors text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Button text="Login" href="/login" />
            )}
          </div>
        )}
      </nav>
  </header>
  );
}
