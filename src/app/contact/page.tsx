'use client';

import { useState, useEffect } from 'react';

interface ContactInfo {
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

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/contact-info');
      const data = await response.json();
      
      if (data.success && data.contactInfo) {
        setContactInfo(data.contactInfo);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // Use default values if API fails
      setContactInfo({
        companyName: 'NutriSap',
        email: 'info@nutrisap.com',
        supportEmail: 'support@nutrisap.com',
        phone: '+1 (555) 123-4567',
        phoneHours: 'Mon-Fri: 8AM-6PM EST',
        address: '123 Wellness Street',
        city: 'Health City',
        state: 'HC',
        zipCode: '12345',
        mondayFridayHours: '8:00 AM - 6:00 PM',
        saturdayHours: '9:00 AM - 4:00 PM',
        sundayHours: 'Closed',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        goal: '',
        message: ''
      });
    }, 3000);
  };

  if (!contactInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Contact <span className="text-black dark:text-gray-100">{contactInfo.companyName}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ready to start your nutrition journey? Get in touch with our team for a free consultation 
              and personalized recommendations.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Get Your Free Consultation</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Fill out the form below and one of our nutrition experts will contact you within 24 hours 
                to discuss your goals and how we can help you achieve them.
              </p>

              {isSubmitted ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-black dark:text-white text-2xl mr-3">✓</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thank you for your message!</h3>
                      <p className="text-gray-700 dark:text-gray-300">We&apos;ll get back to you within 24 hours.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Goal *
                      </label>
                      <select
                        id="goal"
                        name="goal"
                        required
                        value={formData.goal}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Select your goal</option>
                        <option value="weight-loss">Weight Loss</option>
                        <option value="muscle-gain">Muscle Gain</option>
                        <option value="general-wellness">General Wellness</option>
                        <option value="sports-nutrition">Sports Nutrition</option>
                        <option value="medical-nutrition">Medical Nutrition Therapy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tell us about your goals and current situation
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Share any relevant health information, dietary restrictions, or specific goals..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-6 rounded-lg text-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Get My Free Consultation'}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-black dark:text-white text-xl mr-4">📧</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.email}</p>
                    {contactInfo.supportEmail && (
                      <p className="text-gray-600 dark:text-gray-300">{contactInfo.supportEmail}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-black dark:text-white text-xl mr-4">📞</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Phone</h4>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.phone}</p>
                    {contactInfo.phoneHours && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{contactInfo.phoneHours}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-black dark:text-white text-xl mr-4">📍</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Office</h4>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.address}</p>
                    <p className="text-gray-600 dark:text-gray-300">{contactInfo.city}, {contactInfo.state} {contactInfo.zipCode}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Business Hours</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Monday - Friday</span>
                    <span className="text-gray-900 dark:text-white">{contactInfo.mondayFridayHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Saturday</span>
                    <span className="text-gray-900 dark:text-white">{contactInfo.saturdayHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Sunday</span>
                    <span className="text-gray-900 dark:text-white">{contactInfo.sundayHours}</span>
                  </div>
                </div>
              </div>

              {(contactInfo.facebookUrl || contactInfo.twitterUrl || contactInfo.instagramUrl || contactInfo.linkedinUrl) && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    {contactInfo.facebookUrl && (
                      <a href={contactInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                    {contactInfo.twitterUrl && (
                      <a href={contactInfo.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {contactInfo.instagramUrl && (
                      <a href={contactInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.89 2.745.099.118.112.22.083.341-.09.383-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                        </svg>
                      </a>
                    )}
                    {contactInfo.linkedinUrl && (
                      <a href={contactInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How quickly will I see results?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Most clients start seeing positive changes within 2-4 weeks, with significant results typically visible after 8-12 weeks of following their personalized plan.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Do you accommodate dietary restrictions?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Absolutely! We create plans for all dietary needs including vegetarian, vegan, gluten-free, keto, and food allergies.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What&apos;s included in the consultation?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your free consultation includes a comprehensive health assessment, goal setting, and a sample meal plan recommendation.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes! We regularly review and adjust your plan based on your progress, preferences, and changing goals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}