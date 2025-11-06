"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/supabase";

export default function Footer() {

          const [user, setUser] = useState<any>(null);

        useEffect(() => {
          // Get initial user
          getUser().then(setUser).catch(() => setUser(null));
        }, []);
      return (
    <footer className="neumorphic-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo">Belong Here Theater</div>
          <p className="footer-tagline">Change the way you cast and audition</p>
        </div>
        
            {user && (
                        <nav className="footer-nav">

                        <Link href="/company" className="footer-link">
            Company
          </Link>
          <Link href="/shows" className="footer-link">
            Shows
          </Link>
                <Link href="/help" className="footer-link">
            Help
          </Link>
        </nav>
          )
          }
    
        
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Belong Here Theater. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
