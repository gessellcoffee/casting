"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";
import { GrClose } from "react-icons/gr";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdArrowDropDown } from "react-icons/md";
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
      const [showProductionsDropdown, setShowProductionsDropdown] = useState(false);
      const [user, setUser] = useState<any>(null);
      const [profile, setProfile] = useState<Profile | null>(null);
      const router = useRouter();
      const productionsDropdownRef = useRef<HTMLDivElement>(null);

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

      // Close dropdown when clicking outside
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (productionsDropdownRef.current && !productionsDropdownRef.current.contains(event.target as Node)) {
            setShowProductionsDropdown(false);
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

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
        <Link className="neu-link" href="/auditions">Audition</Link>
        
        {/* Productions Dropdown */}
        <div className="relative" ref={productionsDropdownRef}>
          <span
            onClick={() => setShowProductionsDropdown(!showProductionsDropdown)}
            className="neu-link flex items-center gap-0.5 cursor-pointer"
          >
            Productions
            <MdArrowDropDown className={`w-4 h-4 transition-transform ${showProductionsDropdown ? 'rotate-180' : ''}`} />
          </span>
          
          {showProductionsDropdown && (
            <div 
              className="absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-50"
              style={{ 
                background: 'var(--neu-surface)',
                border: '1px solid var(--neu-border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Link 
                href="/cast?filter=casting" 
                className="block px-4 py-3 text-neu-text-primary hover:bg-neu-accent-primary/10 transition-colors border-b border-neu-border"
                onClick={() => setShowProductionsDropdown(false)}
              >
                <div className="font-medium">Casting</div>
                <div className="text-xs text-neu-text-secondary">Auditions & offers</div>
              </Link>
              <Link 
                href="/cast?filter=active" 
                className="block px-4 py-3 text-neu-text-primary hover:bg-neu-accent-primary/10 transition-colors border-b border-neu-border"
                onClick={() => setShowProductionsDropdown(false)}
              >
                <div className="font-medium">Active Shows</div>
                <div className="text-xs text-neu-text-secondary">Rehearsing & performing</div>
              </Link>
              <Link 
                href="/cast" 
                className="block px-4 py-3 text-neu-text-primary hover:bg-neu-accent-primary/10 transition-colors"
                onClick={() => setShowProductionsDropdown(false)}
              >
                <div className="font-medium">All Productions</div>
                <div className="text-xs text-neu-text-secondary">View everything</div>
              </Link>
            </div>
          )}
        </div>
        
        <Link className="neu-link" href= "/users">Users</Link>
      </>
    )}
  </div>
  <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
    <ThemeToggle />
    {user && <NotificationsDropdown userId={user.id} />}
    {user ? (
      <>
      <Link href='/my-shows'>
        <button className='neu-icon-btn' title="My Shows">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625Zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5A.375.375 0 0 0 3 5.625Zm16.125-.375a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0 0 21 7.125v-1.5a.375.375 0 0 0-.375-.375h-1.5ZM21 9.375A.375.375 0 0 0 20.625 9h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5ZM4.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5ZM3.375 15h1.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375Zm0-3.75h1.5a.375.375 0 0 0 .375-.375v-1.5A.375.375 0 0 0 4.875 9h-1.5A.375.375 0 0 0 3 9.375v1.5c0 .207.168.375.375.375Zm4.125 0a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" clipRule="evenodd" />
          </svg>
        </button>
      </Link>
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
      <ThemeToggle />
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
              
              {/* Productions Section */}
              <div className="text-xs font-semibold text-neu-text-secondary px-4 py-2">Productions</div>
              <Link href="/cast?filter=casting" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-secondary text-left px-4 py-3">Casting</button>
              </Link>
              <Link href="/cast?filter=active" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-secondary text-left px-4 py-3">Active Shows</button>
              </Link>
              <Link href="/cast" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-secondary text-left px-4 py-3">All Productions</button>
              </Link>
              
              <Link href="/users" onClick={() => setShowMenu(false)}>
                <button className="w-full n-button-primary text-left px-4 py-3">Users</button>
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
