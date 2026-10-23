// Ye component tab dikhaya jata hai jab koi wedding page private ya restricted ho
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

export default function PrivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFF9F2] text-center">
      <div className="card-royal max-w-md w-full p-8 sm:p-10 border border-[#C9A24B]/60 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF9F2] border-2 border-[#C9A24B] flex items-center justify-center text-3xl mb-6 shadow-sm">
          🔒
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#7A1E3A] mb-3">
          Private Wedding Page
        </h1>
        <p className="text-sm text-[#7A7A7A] leading-relaxed mb-8">
          This wedding page is private or unavailable. Ye page owner ke dwara private mark kiya gaya hai ya temporary roop se band hai.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" className="w-full">
            Go Home ➔
          </Button>
        </Link>
      </div>
    </div>
  );
}
