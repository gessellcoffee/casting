'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RehearsalsPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/productions/active-shows/${params.id}/scheduling`);
  }, [params.id, router]);

  return null;
}
