'use client';

import { useEffect, useState } from 'react';
import HeroModule from "../components/HeroModule";
import Card from "../components/Card";
import { getUser } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <>
      <HeroModule user={user} />
    </>
  );
}
