// Ye component website ke public footer ko render karta hai
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1F0810] text-[#FFF9F2] pt-16 pb-12 border-t border-[#C9A24B]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#7A1E3A] flex items-center justify-center text-white font-serif font-bold text-lg border border-[#C9A24B]">
                💍
              </div>
              <span className="font-serif text-2xl font-bold text-[#FFF9F2]">
                Shaadi<span className="text-[#C9A24B]">Page</span>
              </span>
            </div>
            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              Crafting bespoke, timeless digital wedding experiences. Celebrate your sacred bond with elegant invitations, effortless RSVP tracking, and stunning AI-generated wedding websites.
            </p>
            <div className="pt-2 flex items-center gap-4 text-sm text-[#C9A24B]">
              <span>✦ Royal Aesthetic</span>
              <span>✦ AI Powered</span>
              <span>✦ Instant Sharing</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-base font-bold text-[#C9A24B] mb-4 tracking-wide uppercase text-xs">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Wedding Page
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-serif text-base font-bold text-[#C9A24B] mb-4 tracking-wide uppercase text-xs">
              Celebration Suite
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Ready to create your dream wedding invitation?
            </p>
            <Link
              to="/register"
              className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C9A24B] text-[#1F0810] hover:bg-[#e4be68] transition-colors"
            >
              Get Started Now ✨
            </Link>
          </div>

        </div>

        {/* Golden decorative divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A24B]/40 to-transparent my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} ShaadiPage. All rights reserved.</p>
          <p className="italic font-serif text-[#C9A24B]/80">
            "Where two souls unite in digital harmony"
          </p>
        </div>

      </div>
    </footer>
  );
}
