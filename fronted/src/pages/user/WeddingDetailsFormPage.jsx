// Ye component wedding details (names, date, venue, story, photo) form ko render aur save/update karta hai
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// NEW: useQueryClient import kiya cache sync ke liye
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { createWedding, updateWedding, getMyWedding, uploadWeddingPhoto } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function WeddingDetailsFormPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();


  // Form state
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    story: '',
    photoUrl: '',
  });

  // Photo file & preview state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Status flags
  const [isExisting, setIsExisting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Existing wedding data check karna
  useEffect(() => {
    async function loadExistingData() {
      try {
        setPageLoading(true);
        const data = await getMyWedding();
        const w = data.wedding || data;
        if (w && (w.brideName || w._id || w.id)) {
          setIsExisting(true);
          // Format date for HTML date input: YYYY-MM-DD
          let formattedDate = '';
          if (w.weddingDate) {
            formattedDate = new Date(w.weddingDate).toISOString().split('T')[0];
          }

          setFormData({
            brideName: w.brideName || '',
            groomName: w.groomName || '',
            weddingDate: formattedDate,
            venue: w.venue || '',
            story: w.story || '',
            photoUrl: w.photoUrl || w.photo || '',
          });

          if (w.photoUrl || w.photo) {
            setPhotoPreview(w.photoUrl || w.photo);
          }
        }
      } catch (err) {
        // Agar pehle se record nahi hai to fresh form allow karo
        console.log('No prior wedding data found, fresh entry.');
      } finally {
        setPageLoading(false);
      }
    }

    loadExistingData();
  }, []);

  // Text inputs change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Photo select aur upload handling
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size check (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Photo size must be under 5MB', 'error');
      return;
    }

    setPhotoFile(file);
    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    // Photo ko upload-photo endpoint par post karte hain
    try {
      setUploadingPhoto(true);
      const res = await uploadWeddingPhoto(file);
      const uploadedUrl = res.photoUrl || res.url || res.data?.photoUrl;
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: uploadedUrl }));
        addToast('Photo uploaded successfully! 📸', 'success');
      }
    } catch (err) {
      console.warn('Photo upload API call failed, using preview:', err);
      // Agar backend upload-photo abhi connect na ho to preview retain karte hain
      addToast('Photo selected (Local Preview)', 'info');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Client validation
  const validate = () => {
    const newErrors = {};
    if (!formData.brideName.trim()) newErrors.brideName = "Bride's name is required";
    if (!formData.groomName.trim()) newErrors.groomName = "Groom's name is required";
    if (!formData.weddingDate) newErrors.weddingDate = 'Please choose your wedding date';
    if (!formData.venue.trim()) newErrors.venue = 'Venue location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save/Submit Form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fill in all required fields carefully', 'error');
      return;
    }

    setSaving(true);
    try {
      // PHOTO GUARD: khali photoUrl ko kabhi bhej nahi (warna existing photo
      // overwrite ho jati). Naya upload ho to URL jayega, warna field drop.
      const payload = { ...formData };
      if (!payload.photoUrl) {
        delete payload.photoUrl;
      }

      if (isExisting) {
        // Agar already record hai to PUT /wedding/update call karo
        await updateWedding(payload);
        addToast('Wedding details have been updated! 💍', 'success');
      } else {
        // Pehli baar bana rahe hain to POST /wedding/create call karo
        await createWedding(payload);
        setIsExisting(true);
        addToast('Wedding details have been saved! 💍', 'success');
      }

      // NEW: TanStack cache refresh kiya taaki dashboard aur AI page ko fresh data mile
      queryClient.invalidateQueries({ queryKey: ['myWedding'] });

      // Next step: AI generation page par bhejte hain
      navigate('/wedding/generate');

    } catch (err) {
      const msg = err.message || 'Something went wrong while saving details.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="user" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
        
        {/* Title bar */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
            {isExisting ? 'Edit Wedding Details ✎' : 'Wedding Information Form 📝'}
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Fill in the details about your wedding. Our AI will convert this information into a beautiful wedding webpage.
          </p>
        </div>

        {pageLoading ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Loading wedding details..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-royal p-6 sm:p-10 space-y-8 bg-white">
            
            {/* Section 1: The Couple */}
            <div>
              <h2 className="font-serif text-xl font-bold text-[#7A1E3A] border-b border-[#EADCC9] pb-3 mb-6 flex items-center gap-2">
                <span>👑</span>
                <span>The Wedding Couple</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="brideName"
                  name="brideName"
                  label="Bride's Name"
                  placeholder="e.g. Ananya Sharma"
                  value={formData.brideName}
                  onChange={handleChange}
                  error={errors.brideName}
                  required
                />

                <Input
                  id="groomName"
                  name="groomName"
                  label="Groom's Name"
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.groomName}
                  onChange={handleChange}
                  error={errors.groomName}
                  required
                />
              </div>
            </div>

            {/* Section 2: Date & Venue */}
            <div>
              <h2 className="font-serif text-xl font-bold text-[#7A1E3A] border-b border-[#EADCC9] pb-3 mb-6 flex items-center gap-2">
                <span>📍</span>
                <span>Date & Grand Venue</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="weddingDate"
                  name="weddingDate"
                  type="date"
                  label="Wedding Date"
                  value={formData.weddingDate}
                  onChange={handleChange}
                  error={errors.weddingDate}
                  required
                />

                <Input
                  id="venue"
                  name="venue"
                  label="Venue & City"
                  placeholder="e.g. The Oberoi Udaivilas, Udaipur"
                  value={formData.venue}
                  onChange={handleChange}
                  error={errors.venue}
                  required
                />
              </div>
            </div>

            {/* Section 3: Photo Upload */}
            <div>
              <h2 className="font-serif text-xl font-bold text-[#7A1E3A] border-b border-[#EADCC9] pb-3 mb-6 flex items-center gap-2">
                <span>📸</span>
                <span>Couple Portrait Photo</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#FFF9F2] border border-[#EADCC9]">
                
                {/* Photo Preview Circle/Box */}
                <div className="w-32 h-32 rounded-2xl border-2 border-[#C9A24B] overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm relative group">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Couple Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-gray-400">
                      <span className="text-3xl block">🖼️</span>
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <label className="text-sm font-semibold text-[#2B2B2B] block">
                    Upload High-Resolution Photo
                  </label>
                  <p className="text-xs text-[#7A7A7A]">
                    PNG, JPG, JPEG (Max 5MB). This photo will be displayed on your invitation header banner.
                  </p>
                  <div className="pt-2">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border-2 border-[#C9A24B] text-[#7A1E3A] bg-white hover:bg-[#FFF9F2] cursor-pointer shadow-xs transition-colors"
                    >
                      <span>📁 Choose Photo</span>
                    </label>
                    {photoFile && (
                      <span className="text-xs text-[#2E7D32] ml-3 font-medium">
                        ✓ {photoFile.name}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Section 4: Love Story */}
            <div>
              <h2 className="font-serif text-xl font-bold text-[#7A1E3A] border-b border-[#EADCC9] pb-3 mb-6 flex items-center gap-2">
                <span>💌</span>
                <span>Our Love Story</span>
              </h2>

              <Input
                id="story"
                name="story"
                type="textarea"
                rows={5}
                label="How You Met & Your Journey"
                placeholder="Share a few lines about your magical journey together... (e.g. 'We met during college in Jaipur, bonded over chai and endless conversations, and decided on forever.')"
                value={formData.story}
                onChange={handleChange}
                helperText="This story will be highlighted in the story section of your wedding page."
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#EADCC9] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-[#7A7A7A] hover:text-[#7A1E3A] font-medium"
              >
                ← Back to Dashboard
              </button>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={saving}
                  className="w-full sm:w-auto px-8"
                >
                  {isExisting ? 'Update & Proceed to AI ➔' : 'Save & Proceed to AI ➔'}
                </Button>
              </div>
            </div>

          </form>
        )}

      </main>
    </div>
  );
}
