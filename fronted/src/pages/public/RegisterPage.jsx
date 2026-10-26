// Ye component naye users ke account registration form ko render aur handle karta hai
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { registerUser } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Registration input fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Client validation errors
  const [errors, setErrors] = useState({});
  // Loading state
  const [loading, setLoading] = useState(false);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'The two passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Backend ko name, email, aur password bhejte hain
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      addToast('Account created! You can now log in.', 'success');
      // Login page par redirect karte hain
      navigate('/login');
    } catch (error) {
      const msg = error.message || 'Registration failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md card-royal p-8 sm:p-10 my-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF9F2] border border-[#C9A24B] flex items-center justify-center text-2xl mb-3 shadow-xs">
              ✨
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
              Create an Account
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Start building your wedding page today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-md"
              >
                Register & Continue ➔
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm text-[#7A7A7A]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#7A1E3A] hover:underline">
              Log In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
