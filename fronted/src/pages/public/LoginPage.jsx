// Ye component user aur admin ke liye login page render karta hai aur authentication handle karta hai
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { loginUser } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addToast } = useToast();

  // Form input fields state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Client-side validation errors state
  const [errors, setErrors] = useState({});
  // API loading state
  const [loading, setLoading] = useState(false);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Error clear karna jab user type kare
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Form validate karne ka function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address enter karna zaruri hai';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email address enter karein';
    }

    if (!formData.password) {
      newErrors.password = 'Password enter karna zaruri hai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit button dabane par login API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await loginUser(formData);
      
      // Token aur user details fetch result se nikalte hain
      const token = response.token || response.data?.token;
      const userData = response.user || response.data?.user || { role: response.role || 'user' };

      if (!token) {
        throw new Error('Authentication token praapt nahi hua');
      }

      // AuthContext me session save karo
      login(token, userData);
      addToast('Login safaltapoorvak ho gaya!', 'success');

      // User role ke hisaab se redirect karo
      const role = userData.role || 'user';
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      const msg = error.message || 'Login karne me dikkat aayi. Kripya credentials check karein.';
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
              💍
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
              Welcome Back
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Apne ShaadiPage account me sign in karein
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-md"
              >
                Sign In ➔
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm text-[#7A7A7A]">
            Naya account banana chahte hain?{' '}
            <Link to="/register" className="font-semibold text-[#7A1E3A] hover:underline">
              Register Here
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
