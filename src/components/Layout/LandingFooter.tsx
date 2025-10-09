import React from 'react'
import { BarChart3, Mail, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

interface LandingFooterProps {
  onLogin: () => void
  onLegalClick: (page: 'privacy' | 'terms' | 'cookies' | 'compliance') => void
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onLogin, onLegalClick }) => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'FAQ', href: '#faq' }
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: 'mailto:hello@ratemonitorpro.com' }
    ],
    legal: [
      { label: 'Privacy Policy', page: 'privacy' as const },
      { label: 'Terms of Service', page: 'terms' as const },
      { label: 'Cookie Policy', page: 'cookies' as const },
      { label: 'Compliance', page: 'compliance' as const }
    ],
    support: [
      { label: 'Help Center', href: 'mailto:support@ratemonitorpro.com' },
      { label: 'Contact Support', href: 'mailto:support@ratemonitorpro.com' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' }
  ]

  const trustBadges = [
    { text: 'SOC 2 Compliant', icon: '🔒' },
    { text: 'GDPR Ready', icon: '🇪🇺' },
    { text: 'SSL Encrypted', icon: '🛡️' },
    { text: '99.9% Uptime', icon: '⚡' }
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Rate Monitor Pro</h3>
                <p className="text-xs text-gray-400">Mortgage Rate Intelligence</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              The most advanced mortgage rate monitoring and CRM platform for modern mortgage professionals. 
              Automate your workflow, never miss opportunities, and grow your business.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a href="mailto:support@ratemonitorpro.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                support@ratemonitorpro.com
              </a>
              <a href="tel:+18005551234" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                (800) 555-1234
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => onLegalClick(link.page)}
                    className="text-sm text-gray-400 hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div 
                key={badge.text}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <span className="text-xl">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-white font-semibold mb-2">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4">
              Get the latest mortgage rate insights and product updates delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button 
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <p className="text-sm text-gray-400">
              © {currentYear} Rate Monitor Pro. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>

            {/* Login Link */}
            <button
              onClick={onLogin}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Already have an account? <span className="text-blue-400 font-medium">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}