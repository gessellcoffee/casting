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
<nav id="desktop-menu" className="hidden lg:flex items-center justify-between w-full">
      <div className="logo flex-shrink-0">
        <Link href="/">Belong Here Theater</Link>
  </div>
  <div className="nav-buttons flex items-center justify-center gap-2 xl:gap-4 mx-4">
    {user && (
      <>
        <Button text="Audition" href="/auditions" />
        <Button text="Cast" href="/cast" />
        <Button text="Shows" href="/shows" />
        <Button text="Company" href="/company" />
      </>
    )}
  </div>
  <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
    {user && <NotificationsDropdown userId={user.id} />}
    {user ? (
      <>
      <Link href='/my-auditions'>
        <button className='neu-icon-btn' title="My Calendar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 11.993a.75.75 0 0 0-.75.75v.006c0 .414.336.75.75.75h.006a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75H12ZM12 16.494a.75.75 0 0 0-.75.75v.005c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H12ZM8.999 17.244a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.006ZM7.499 16.494a.75.75 0 0 0-.75.75v.005c0 .414.336.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H7.5ZM13.499 14.997a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.005a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.005ZM14.25 16.494a.75.75 0 0 0-.75.75v.006c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75h-.005ZM15.75 14.995a.75.75 0 0 1 .75-.75h.005a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75H16.5a.75.75 0 0 1-.75-.75v-.006ZM13.498 12.743a.75.75 0 0 1 .75-.75h2.25a.75.75 0 1 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75ZM6.748 14.993a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" />
            <path fillRule="evenodd" d="M18 2.993a.75.75 0 0 0-1.5 0v1.5h-9V2.994a.75.75 0 1 0-1.5 0v1.497h-.752a3 3 0 0 0-3 3v11.252a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3V7.492a3 3 0 0 0-3-3H18V2.993ZM3.748 18.743v-7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </Link>
        <Link href="/profile">
          <div className="avatar">
            <img className="rounded-full" src={profile?.profile_photo_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/50"} alt="Avatar"/>
          </div>
        </Link>
        <button 
          onClick={handleSignOut}
          className="n-button-secondary text-sm"
        >
          Sign Out
        </button>
      </>
    ) : (
      <Button text="Login" href="/login" />
    )}
  </div>
</nav>
  <nav className="lg:hidden flex items-center justify-between w-full gap-2 font-semibold">
    <div className="logo">
      Belong Here Theater
    </div>
    
    {/* Mobile Right Section */}
    <div className="flex items-center gap-2">
      {user && (
        <>
          <NotificationsDropdown userId={user.id} />
          <Link href='/my-auditions'>
            <button className='neu-icon-btn' title="My Calendar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 11.993a.75.75 0 0 0-.75.75v.006c0 .414.336.75.75.75h.006a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75H12ZM12 16.494a.75.75 0 0 0-.75.75v.005c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H12ZM8.999 17.244a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.006ZM7.499 16.494a.75.75 0 0 0-.75.75v.005c0 .414.336.75.75.75h.005a.75.75 0 0 0 .75-.75v-.005a.75.75 0 0 0-.75-.75H7.5ZM13.499 14.997a.75.75 0 0 1 .75-.75h.006a.75.75 0 0 1 .75.75v.005a.75.75 0 0 1-.75.75h-.006a.75.75 0 0 1-.75-.75v-.005ZM14.25 16.494a.75.75 0 0 0-.75.75v.006c0 .414.335.75.75.75h.005a.75.75 0 0 0 .75-.75v-.006a.75.75 0 0 0-.75-.75h-.005ZM15.75 14.995a.75.75 0 0 1 .75-.75h.005a.75.75 0 0 1 .75.75v.006a.75.75 0 0 1-.75.75H16.5a.75.75 0 0 1-.75-.75v-.006ZM13.498 12.743a.75.75 0 0 1 .75-.75h2.25a.75.75 0 1 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75ZM6.748 14.993a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" />
                <path fillRule="evenodd" d="M18 2.993a.75.75 0 0 0-1.5 0v1.5h-9V2.994a.75.75 0 1 0-1.5 0v1.497h-.752a3 3 0 0 0-3 3v11.252a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3V7.492a3 3 0 0 0-3-3H18V2.993ZM3.748 18.743v-7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </Link>
          <Link href="/profile">
            <div className="avatar w-10 h-10">
              <img className="rounded-full" src={profile?.profile_photo_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/50"} alt="Avatar"/>
            </div>
          </Link>
        </>
      )}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="neu-icon-btn"
      >
        {showMenu ? <GrClose className="w-5 h-5" /> : <GiHamburgerMenu className="w-5 h-5" />}
      </button>
    </div>
    
    {/* Mobile Dropdown Menu */}
    {showMenu && (
      <div className="neu-dropdown absolute top-[4.5rem] left-4 right-4 z-50">
        <div className="flex flex-col gap-2 p-3">
          {user ? (
            <>
              <Link href="/auditions" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-primary text-left px-4 py-3">Audition</button>
              </Link>
              <Link href="/cast" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-primary text-left px-4 py-3">Cast</button>
              </Link>
              <Link href="/shows" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-primary text-left px-4 py-3">Shows</button>
              </Link>
              <Link href="/company" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-primary text-left px-4 py-3">Company</button>
              </Link>
              <div className="border-t border-neu-border my-2"></div>
              <button 
                onClick={() => {
                  setShowMenu(false);
                  handleSignOut();
                }}
                className="w-full n-button-danger text-left px-4 py-3"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setShowMenu(false)}>
              <button className="w-full n-button-primary px-4 py-3">Login</button>
            </Link>
          )}
        </div>
      </div>
    )}
  </nav>
  </header>
  );
}
