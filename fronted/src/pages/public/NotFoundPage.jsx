// Ye component 404 Not Found error page render karta hai jab koi route match na ho
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFF9F2] text-center">
      <div className="card-royal max-w-md w-full p-8 sm:p-10 border border-[#EADCC9] shadow-xl">
        <div className="font-serif text-6xl font-bold text-[#7A1E3A] mb-2 tracking-tight">
          404
        </div>
        <div className="w-12 h-1 bg-[#C9A24B] mx-auto rounded-full mb-6" />
        <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-[#7A7A7A] leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" className="w-full">
            Go to Homepage ➔
          </Button>
        </Link>
      </div>
    </div>
  );
}
