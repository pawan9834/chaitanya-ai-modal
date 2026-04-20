'use client';

import dynamic from 'next/dynamic';

// Dynamically import the dashboard shell with SSR disabled.
// This is the definitive fix for persistent hydration mismatches in high-complexity AI interfaces.
const DashboardShell = dynamic(() => import('@/components/DashboardShell'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white animate-spin border-t-transparent"></div>
    </div>
  )
});

export default function Home() {
  return <DashboardShell />;
}
