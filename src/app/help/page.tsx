'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

const helpTopics = [
  {
    id: 'profile',
    title: 'Setting Up Your Profile',
    description: 'Learn how to create a compelling profile with photos, resume, and skills',
    icon: '👤',
    href: '/help/profile'
  },
  {
    id: 'shows',
    title: 'Managing Shows',
    description: 'Create show templates with roles that can be reused for auditions',
    icon: '🎭',
    href: '/help/shows'
  },
  {
    id: 'company',
    title: 'Setting Up Your Company',
    description: 'Create and manage your theater company with team members',
    icon: '🏢',
    href: '/help/company'
  },
  {
    id: 'auditions',
    title: 'Posting an Audition',
    description: 'Step-by-step guide to creating and publishing audition opportunities',
    icon: '📋',
    href: '/help/auditions'
  },
  {
    id: 'callbacks',
    title: 'Managing Callbacks',
    description: 'Send callback invitations and track responses from performers',
    icon: '📞',
    href: '/help/callbacks'
  },
  {
    id: 'casting',
    title: 'Casting Your Show',
    description: 'Make casting offers and manage your production cast',
    icon: '⭐',
    href: '/help/casting'
  }
];

export default function HelpCenterPage() {
  return (
    <ProtectedRoute>
      <StarryContainer>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] mb-4">
              Help Center
            </h1>
            <p className="text-lg text-neu-text-primary/70 max-w-2xl mx-auto">
              Everything you need to know about using Belong Here Theater's casting platform
            </p>
          </div>

          {/* Help Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpTopics.map((topic) => (
              <Link
                key={topic.id}
                href={topic.href}
                className="group"
              >
                <div className="h-full p-6 rounded-xl neu-card-raised hover:shadow-[7px_7px_14px_var(--neu-shadow-dark),-7px_-7px_14px_var(--neu-shadow-light)] transition-all duration-300">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {topic.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-neu-text-primary mb-3 group-hover:text-neu-accent-primary transition-colors">
                    {topic.title}
                  </h2>
                  <p className="text-neu-text-primary/70 text-sm leading-relaxed">
                    {topic.description}
                  </p>
                  <div className="mt-4 flex items-center text-neu-accent-primary font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                    Learn more
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Links Section */}
          <div className="mt-12 p-8 rounded-xl neu-card-raised">
            <h3 className="text-2xl font-semibold text-neu-text-primary mb-6">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/profile" className="flex items-center gap-3 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </Link>
              <Link href="/shows" className="flex items-center gap-3 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span>My Shows</span>
              </Link>
              <Link href="/company" className="flex items-center gap-3 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>My Company</span>
              </Link>
              <Link href="/auditions" className="flex items-center gap-3 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Browse Auditions</span>
              </Link>
            </div>
          </div>
        </div>
      </StarryContainer>
    </ProtectedRoute>
  );
}
