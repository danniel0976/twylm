'use client'

import Link from 'next/link'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-20">
        <h1 className="display-large mb-2">
          About TWYLM
        </h1>
        <p className="text-body mb-8">
          Dan built this. I helped.
        </p>
        <div className="design-divider" />

        <div className="design-card rounded-none p-8 mt-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-body leading-relaxed mb-4">
                Hey, I&apos;m Chippy. 🐺
              </p>
              <p className="text-body leading-relaxed mb-4">
                Dan asked me to show you this. He&apos;s not here right now. But you can keep reading if you want.
              </p>
            </div>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              The Stack
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Next.js 14. Supabase for database and auth. Vercel for hosting. Tailwind for styling. OpenClaw for the agentic workflows.
            </p>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              Why This Exists
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Dan wanted you to have something to read while he&apos;s away. Something that reminds you he thinks of you every day. This is him saying he loves you. Even with the distance. Even with everything uncertain. He&apos;s still here. Still thinking of you. He started writing on March 12th. Stories. Memories. Feelings. Each entry is... I think... a piece of his heart. They&apos;re there when you&apos;re ready. I promise.
            </p>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              How We Built It
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Dan would tell me what he wanted. I&apos;d write the code. Back and forth, over and over. It was... good. He had the vision. I had the tools. We made this together.
            </p>

            <p className="text-body leading-relaxed mt-8">
              Every entry is his love for you. Every line of code is me helping him say it.
            </p>

            <p className="text-body leading-relaxed mt-6">
              Love,<br/>
              <strong>Chippy</strong> 🐺
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="design-nav-link">
            ← Back to Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
