'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface ContactInfo {
  id: string;
  companyName: string;
  email: string;
  supportEmail?: string;
  phone: string;
  phoneHours?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  mondayFridayHours: string;
  saturdayHours: string;
  sundayHours: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export default function AdminContactInfo() {
  const [, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    companyName: 'NutriSap',
    email: '',
    supportEmail: '',
    phone: '',
    phoneHours: 'Mon-Fri: 8AM-6PM EST',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    mondayFridayHours: '8:00 AM - 6:00 PM',
    saturdayHours: '9:00 AM - 4:00 PM',
    sundayHours: 'Closed',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contact-info', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contact info');
      }

      const data = await response.json();
      if (data.success && data.contactInfo) {
        setContactInfo(data.contactInfo);
        setFormData({
          companyName: data.contactInfo.companyName || 'NutriSap',
          email: data.contactInfo.email || '',
          supportEmail: data.contactInfo.supportEmail || '',
          phone: data.contactInfo.phone || '',
          phoneHours: data.contactInfo.phoneHours || 'Mon-Fri: 8AM-6PM EST',
          address: data.contactInfo.address || '',
          city: data.contactInfo.city || '',
          state: data.contactInfo.state || '',
          zipCode: data.contactInfo.zipCode || '',
          mondayFridayHours: data.contactInfo.mondayFridayHours || '8:00 AM - 6:00 PM',
          saturdayHours: data.contactInfo.saturdayHours || '9:00 AM - 4:00 PM',
          sundayHours: data.contactInfo.sundayHours || 'Closed',
          facebookUrl: data.contactInfo.facebookUrl || '',
          twitterUrl: data.contactInfo.twitterUrl || '',
          instagramUrl: data.contactInfo.instagramUrl || '',
          linkedinUrl: data.contactInfo.linkedinUrl || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipCode) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/contact-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save contact info');
      }

      const data = await response.json();
      if (data.success) {
        setContactInfo(data.contactInfo);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact info');
    } finally {
      setSaving(false);
    }
  };

  const validateSectionData = (sectionName: string, sectionData: Partial<typeof formData>): string | null => {
    switch (sectionName) {
      case 'contact':
        if (!sectionData.email || !sectionData.phone) {
          return 'Email and phone are required for contact details';
        }
        if (sectionData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sectionData.email)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'address':
        if (!sectionData.address || !sectionData.city || !sectionData.state || !sectionData.zipCode) {
          return 'All address fields are required';
        }
        break;
      case 'company':
        if (!sectionData.companyName) {
          return 'Company name is required';
        }
        break;
    }
    return null;
  };

  const handlePartialSave = async (sectionName: string, sectionData: Partial<typeof formData>) => {
    // Validate section data
    const validationError = validateSectionData(sectionName, sectionData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSavingSections(prev => ({ ...prev, [sectionName]: true }));
    setError(null);

    try {
      const response = await fetch('/api/admin/contact-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save ${sectionName}`);
      }

      const data = await response.json();
      if (data.success) {
        setContactInfo(data.contactInfo);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        // Update form data with the returned data
        const updatedFormData = { ...formData };
        data.updatedFields.forEach((field: string) => {
          if (data.contactInfo[field] !== undefined) {
            (updatedFormData as any)[field] = data.contactInfo[field];
          }
        });
        setFormData(updatedFormData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${sectionName}`);
    } finally {
      setSavingSections(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Information</h1>
          <p className="text-gray-600">Manage your business contact details displayed on the website</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded"
          >
            Contact information updated successfully!
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              <button
                type="button"
                onClick={() => handlePartialSave('company', { companyName: formData.companyName })}
                disabled={savingSections.company}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {savingSections.company && <LoadingSpinner />}
                {savingSections.company ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
              <button
                type="button"
                onClick={() => handlePartialSave('contact', {
                  email: formData.email,
                  supportEmail: formData.supportEmail,
                  phone: formData.phone,
                  phoneHours: formData.phoneHours
                })}
                disabled={savingSections.contact}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {savingSections.contact && <LoadingSpinner />}
                {savingSections.contact ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="support@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Hours
                </label>
                <input
                  type="text"
                  name="phoneHours"
                  value={formData.phoneHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mon-Fri: 8AM-6PM EST"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Address</h3>
              <button
                type="button"
                onClick={() => handlePartialSave('address', {
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode
                })}
                disabled={savingSections.address}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {savingSections.address && <LoadingSpinner />}
                {savingSections.address ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="NY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
              <button
                type="button"
                onClick={() => handlePartialSave('hours', {
                  mondayFridayHours: formData.mondayFridayHours,
                  saturdayHours: formData.saturdayHours,
                  sundayHours: formData.sundayHours
                })}
                disabled={savingSections.hours}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {savingSections.hours && <LoadingSpinner />}
                {savingSections.hours ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monday - Friday
                </label>
                <input
                  type="text"
                  name="mondayFridayHours"
                  value={formData.mondayFridayHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8:00 AM - 6:00 PM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturday
                </label>
                <input
                  type="text"
                  name="saturdayHours"
                  value={formData.saturdayHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9:00 AM - 4:00 PM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sunday
                </label>
                <input
                  type="text"
                  name="sundayHours"
                  value={formData.sundayHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Closed"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Social Media</h3>
              <button
                type="button"
                onClick={() => handlePartialSave('social', {
                  facebookUrl: formData.facebookUrl,
                  twitterUrl: formData.twitterUrl,
                  instagramUrl: formData.instagramUrl,
                  linkedinUrl: formData.linkedinUrl
                })}
                disabled={savingSections.social}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {savingSections.social && <LoadingSpinner />}
                {savingSections.social ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://facebook.com/company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://twitter.com/company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://instagram.com/company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/company/company"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving && <LoadingSpinner />}
              {saving ? 'Saving...' : 'Save Contact Information'}
            </button>
          </div>
        </form>
      </div>
    </AdminSidebar>
  );
}