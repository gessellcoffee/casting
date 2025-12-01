import { ReactNode } from 'react';

export default function LiveAuditionLayout({ children }: { children: ReactNode }) {
  // This layout prevents the app header/footer from appearing
  // The Live Audition Manager is a full-page dedicated interface
  return <>{children}</>;
}
