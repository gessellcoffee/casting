"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getUser } from "@/lib/supabase";
import { checkUserFormsAccess } from "@/lib/supabase/customForms";
import Logo from "./Logo";

export default function Footer() {

          const [user, setUser] = useState<any>(null);
          const [hasFormsAccess, setHasFormsAccess] = useState(false);

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
          // Check forms access when user changes
          if (user?.id) {
            checkUserFormsAccess(user.id).then(({ hasAccess }) => {
              setHasFormsAccess(hasAccess);
            }).catch(() => {
              setHasFormsAccess(false);
            });
          } else {
            setHasFormsAccess(false);
          }
        }, [user]);
  return (
    <footer className="neumorphic-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Logo size={48} showText={true} />
          <p className="footer-tagline">Change the way you cast and audition</p>
        </div>
        
        {user && (
          <nav className="footer-nav">
            <Link className='neu-link' href="/company">
              Company
            </Link>
            <Link className='neu-link' href="/shows">
              Shows
            </Link>
            {hasFormsAccess && (
              <Link className='neu-link' href="/forms">
                Forms
              </Link>
            )}
            <Link className='neu-link' href="/help">
              Help
            </Link>
          </nav>
        )}
      </div>
      
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} Belong Here Theater. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
