import Link from 'next/link'

import { Container } from '@/components/react-layout/Container'
import { FadeIn } from '@/components/react-layout/FadeIn'


function Navigation() {
  return (
    <nav>
   
    </nav>
  )
}

export function Footer() {
  return (
    <Container as="footer" className="mt-24 w-full sm:mt-32 lg:mt-40">
      <FadeIn>
        <Navigation />
        <div className="mt-24 mb-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-neutral-950/10 pt-12">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-700">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms-of-service" className="hover:underline">
              Terms of Service
            </Link>
          </div>
          <p className="h-8 text-xs sm:text-sm text-neutral-700 flex items-center">
            © Kounted.{new Date().getFullYear()}
          </p>
        </div>
      </FadeIn>
    </Container>
  )
}
