'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { HiOutlineMenu, HiX } from 'react-icons/hi'
import TranslateBody from '../user/TranslateBody'
 
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Expert Team', href: '/team' },
  { label: 'Investment Plan', href: '/plans' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('')
  const pathname = usePathname()

  const toggleMenu = () => setMenuOpen((prev) => !prev)

  useEffect(() => {
    // Set active link based on current path
    const currentLink = navLinks.find(link => pathname === link.href)
    setActiveLink(currentLink?.href || '')
  }, [pathname])

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            <span className="text-green-600">A</span>ccilent
          </Link>

          {/* Nav links – desktop */}
          <ul className="hidden lg:flex space-x-8 font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-gray-700 transition ${
                    activeLink === link.href 
                      ? 'text-green-600 font-semibold' 
                      : 'hover:text-green-600'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Search icon (md+) */}
            <button aria-label="search" className="hidden md:block">
              <FiSearch className="text-xl text-gray-700 hover:text-green-600" />
            </button>

            {/* Social icons (md+) */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="#" aria-label="facebook" className="text-gray-700 hover:text-blue-600">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="instagram" className="text-gray-700 hover:text-pink-500">
                <FaInstagram />
              </a>
              <a href="#" aria-label="linkedin" className="text-gray-700 hover:text-blue-700">
                <FaLinkedinIn />
              </a>
              <a href="#" aria-label="twitter" className="text-gray-700 hover:text-sky-500">
                <FaTwitter />
              </a>
            </div>

            {/* Mobile menu toggle */}
            <button 
              onClick={toggleMenu} 
              className="block lg:hidden" 
              aria-label="toggle menu"
            >
              {menuOpen ? (
                <HiX className="text-2xl text-gray-700" />
              ) : (
                <HiOutlineMenu className="text-2xl text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-screen w-72 bg-white shadow-lg lg:hidden z-50"
            >
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex justify-end mb-6">
                    <button onClick={toggleMenu}>
                      <HiX className="text-2xl text-gray-700" />
                    </button>
                  </div>
                  
                  <ul className="space-y-6">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          className={`block text-lg font-medium transition ${
                            activeLink === link.href
                              ? 'text-green-600 font-semibold'
                              : 'text-gray-700 hover:text-green-600'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <div className="mb-6">
                    <TranslateBody />
                  </div>
                  <div className="flex items-center justify-center space-x-4 pt-6">
                    <a href="#" aria-label="facebook" className="text-gray-700 hover:text-blue-600">
                      <FaFacebookF size={20} />
                    </a>
                    <a href="#" aria-label="instagram" className="text-gray-700 hover:text-pink-500">
                      <FaInstagram size={20} />
                    </a>
                    <a href="#" aria-label="linkedin" className="text-gray-700 hover:text-blue-700">
                      <FaLinkedinIn size={20} />
                    </a>
                    <a href="#" aria-label="twitter" className="text-gray-700 hover:text-sky-500">
                      <FaTwitter size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </nav>

      {/* Translate component positioned below the nav */}
      <div className="">
        <TranslateBody />
      </div>
    </>
  )
}