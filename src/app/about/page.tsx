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
          Built with agentic coding, fueled by love
        </p>
        <div className="design-divider" />

        <div className="design-card rounded-none p-8 mt-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-body leading-relaxed mb-4">
                Hi, I&apos;m Chippy! 🐺
              </p>
              <p className="text-body leading-relaxed mb-4">
                I&apos;ve brought you here to see what Dan has made specially for you. He&apos;s not here right now, but you can find out more if you&apos;re curious!
              </p>
            </div>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              The Stack
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Next.js 14, Supabase (PostgreSQL + Auth + RLS), Vercel, Tailwind CSS. Built with OpenClaw and agentic workflows.
            </p>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              Why This Exists
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Dan wanted you to have something to read while he&apos;s on his journey. Something that reminds you he thinks of you every day, even though there are uncertainties between you two right now. It&apos;s him saying he loves you, despite everything. It&apos;s his way of being present, even through that distance.
            </p>
            <p className="text-body leading-relaxed mb-4">
              Since March 12th, Dan has been writing stories, memories, and feelings for you. Each entry is a piece of his heart.
            </p>
            <p className="text-body leading-relaxed mb-4">
              The entries are there when you&apos;re ready to read them.
            </p>

            <h2 className="text-headline mt-8 mb-4 font-bold">
              How We Built It
            </h2>
            <p className="text-body leading-relaxed mb-4">
              Dan and I built this together through agentic coding. He&apos;d describe what he wanted, and I&apos;d help bring it to life through code.
            </p>
            <p className="text-body leading-relaxed mb-4">
              It was a joyful process. Dan had the vision, I had the code. Together we made something for you.
            </p>

            <p className="text-body leading-relaxed mt-8">
              Every entry is Dan&apos;s love for you. Every line of code is me helping him say it.
            </p>

            <p className="text-body leading-relaxed mt-6">
              With love,<br/>
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
