// Ye component ShaadiPage ka public landing page render karta hai jisme Hero, Features aur How It Works sections hain
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2]">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-white via-[#FFF9F2] to-[#FFF9F2]">
        
        {/* Decorative background accents */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-28 left-10 w-64 h-64 bg-[#7A1E3A]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          
          {/* Top Tag badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF9F2] border border-[#C9A24B] shadow-xs text-xs font-semibold text-[#7A1E3A] tracking-wider uppercase">
            <span>✨</span>
            <span>Next-Gen Royal Wedding Invitations</span>
          </div>

          {/* Main Headline (Playfair Display) */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-[#7A1E3A] leading-tight tracking-tight">
            Your Love Story, <br className="hidden sm:inline" />
            <span className="text-[#C9A24B] italic">Beautifully Online</span>
          </h1>

          {/* Subheading / Tagline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-[#7A7A7A] leading-relaxed">
            Create luxurious, AI-designed wedding websites and invitations in minutes. Share your itinerary, photo memories, and love story with guests across the world.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-3.5 shadow-lg hover:shadow-xl">
                {isAuthenticated ? 'Go to Dashboard ✨' : 'Start Creating Free 💍'}
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
                See How It Works ➔
              </Button>
            </a>
          </div>

          {/* Hero Feature Badges */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-[#7A7A7A] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-[#2E7D32]">✓</span> Instant AI Page Generation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#2E7D32]">✓</span> Custom Shareable Link
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#2E7D32]">✓</span> 100% Mobile & Desktop Ready
            </span>
          </div>

        </div>
      </section>

      {/* Decorative Gold Ribbon Divider */}
      <div className="w-full gold-divider" />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">
            Simple 3-Step Process
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#7A1E3A]">
            How ShaadiPage Works
          </h2>
          <p className="text-[#7A7A7A] text-sm sm:text-base">
            Apne wedding day ko digitally memorable banana ab behad aasan hai.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="card-royal p-8 flex flex-col items-center text-center relative group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-2 border-[#C9A24B] flex items-center justify-center text-2xl font-serif font-bold text-[#7A1E3A] mb-6 shadow-sm group-hover:scale-105 transition-transform">
              1
            </div>
            <h3 className="font-serif text-xl font-bold text-[#7A1E3A] mb-3">
              Fill Your Wedding Details
            </h3>
            <p className="text-sm text-[#7A7A7A] leading-relaxed">
              Dulha-Dulhan ke naam, shadi ki tareekh, venue, photo aur apni pyari love story submit karein.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card-royal p-8 flex flex-col items-center text-center relative group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-2 border-[#C9A24B] flex items-center justify-center text-2xl font-serif font-bold text-[#7A1E3A] mb-6 shadow-sm group-hover:scale-105 transition-transform">
              2
            </div>
            <h3 className="font-serif text-xl font-bold text-[#7A1E3A] mb-3">
              AI Generates Your Page
            </h3>
            <p className="text-sm text-[#7A7A7A] leading-relaxed">
              Ek single click me hamara intelligent engine aapke liye royal themed wedding website ready kar deta hai.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card-royal p-8 flex flex-col items-center text-center relative group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-2 border-[#C9A24B] flex items-center justify-center text-2xl font-serif font-bold text-[#7A1E3A] mb-6 shadow-sm group-hover:scale-105 transition-transform">
              3
            </div>
            <h3 className="font-serif text-xl font-bold text-[#7A1E3A] mb-3">
              Share With Loved Ones
            </h3>
            <p className="text-sm text-[#7A7A7A] leading-relaxed">
              Apna personalized public link WhatsApp, Instagram aur digital cards par friends aur family ke saath share karein.
            </p>
          </div>

        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-white border-y border-[#EADCC9] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <p className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">
              Royal Experience
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#7A1E3A]">
              Designed for Memorable Celebrations
            </h2>
            <p className="text-[#7A7A7A] text-sm sm:text-base">
              Har shaadi anokhi hoti hai, aur aapki digital invitation bhi anokhi honi chahiye.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">👑</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                Royal Aesthetics
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                Deep Royal Maroon aur Beaten Gold borders jo aapki celebration ko shaahi ehsaas dete hain.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">📱</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                Mobile & Tablet Friendly
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                Aapke mehman chahe phone par dekhein ya laptop par, design hamesha flawless dikhega.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">⚡</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                Instant Page Regeneration
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                Agar koi details badalni ho to kabhi bhi edit karein aur naye updates instant live paayein.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">💌</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                One-Click Social Sharing
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                WhatsApp aur social media ke liye direct shareable link jise koi bhi browser me khol sakta hai.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">🔒</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                Privacy Controls
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                Aap decide karein ki aapka wedding page public rahega ya private.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-[#EADCC9] bg-[#FFF9F2]/40 hover:bg-[#FFF9F2] transition-colors">
              <span className="text-3xl mb-4 block">📸</span>
              <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-2">
                Couple Photo Showcase
              </h3>
              <p className="text-sm text-[#7A7A7A]">
                High-resolution couple portrait upload karein jo landing banner par beautifully fit hota hai.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-[#7A1E3A] to-[#5A1429] text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Create Your Wedding Website Today
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base">
            Join hundreds of happy couples who celebrated their union with a modern digital ShaadiPage.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <button className="px-8 py-3.5 rounded-xl font-semibold bg-[#C9A24B] hover:bg-[#e2bc67] text-[#380213] shadow-xl transition-all transform hover:scale-105 cursor-pointer">
                Get Started For Free ➔
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <Footer />
    </div>
  );
}
