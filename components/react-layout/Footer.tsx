import Link from 'next/link'

import { Container } from '@/components/react-layout/Container'
import { FadeIn } from '@/components/react-layout/FadeIn'
import { KountedIcon } from '@/lib/assets/icons/KountedIcon'

const navigation = [
  {
    title: 'Business Suite',
    links: [
      { title: 'Kounted Prototype', href: '/suite' },
    ],
  },
]

function Navigation() {
  return (
    <nav>
      <ul role="list" className="grid grid-cols-2 gap-8 sm:grid-cols-2">
        {navigation.map((section, sectionIndex) => (
          <li key={sectionIndex}>
            <div className="font-display text-sm font-semibold tracking-wider text-neutral-950">
              {section.title}
            </div>
            <ul role="list" className="mt-4 text-sm text-neutral-700">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex} className="mt-4">
                  <Link
                    href={link.href}
                    className="transition hover:text-neutral-950"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  return (
    <Container as="footer" className="mt-24 w-full sm:mt-32 lg:mt-40">
      <FadeIn>
        <Navigation />
        <div className="mt-24 mb-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-neutral-950/10 pt-12">
          <Link href="/" aria-label="kounted Home Page">
            <KountedIcon className="h-8" variant="dark" />
          </Link>
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
