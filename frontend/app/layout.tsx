import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'DrugThread — Follow every thread behind a drug',
  description:
    'Agentic pharmaceutical intelligence. Reconstruct the FDA label, biological network, and clinical-development history of any drug — including the failures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dt-bg text-dt-text min-h-screen">
        {/* Runs before first paint — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('dt-theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`,
          }}
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
