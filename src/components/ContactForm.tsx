'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="input-group relative">
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full py-3 text-base !text-black dark:text-white caret-black !bg-transparent appearance-none border-0 border-b-2 border-border outline-none transition-all duration-300 focus:border-primary peer"
        />
        <label
          htmlFor="name"
          className={`absolute left-0 py-3 text-base text-muted-foreground pointer-events-none transition-all duration-300 ${
            formData.name ? '-top-5 text-xs text-primary' : 'top-0'
          } peer-focus:-top-5 peer-focus:text-xs peer-focus:text-primary`}
        >
          Your Name
        </label>
      </div>
      
      <div className="input-group relative">
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full py-3 text-base !text-black dark:text-white caret-black !bg-transparent appearance-none border-0 border-b-2 border-border outline-none transition-all duration-300 focus:border-primary peer"
        />
        <label
          htmlFor="email"
          className={`absolute left-0 py-3 text-base text-muted-foreground pointer-events-none transition-all duration-300 ${
            formData.email ? '-top-5 text-xs text-primary' : 'top-0'
          } peer-focus:-top-5 peer-focus:text-xs peer-focus:text-primary`}
        >
          Email Address
        </label>
      </div>
      
      <div className="input-group relative">
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full py-3 text-base !text-black dark:text-white caret-black !bg-transparent appearance-none border-0 border-b-2 border-border outline-none transition-all duration-300 focus:border-primary peer"
        />
        <label
          htmlFor="phone"
          className={`absolute left-0 py-3 text-base text-muted-foreground pointer-events-none transition-all duration-300 ${
            formData.phone ? '-top-5 text-xs text-primary' : 'top-0'
          } peer-focus:-top-5 peer-focus:text-xs peer-focus:text-primary`}
        >
          Phone Number
        </label>
      </div>
      
      <div className="input-group relative">
        <textarea
          id="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full py-3 text-base !text-black dark:text-white caret-black !bg-transparent appearance-none border-0 border-b-2 border-border outline-none transition-all duration-300 focus:border-primary peer resize-none"
        />
        <label
          htmlFor="message"
          className={`absolute left-0 py-3 text-base text-muted-foreground pointer-events-none transition-all duration-300 ${
            formData.message ? '-top-5 text-xs text-primary' : 'top-0'
          } peer-focus:-top-5 peer-focus:text-xs peer-focus:text-primary`}
        >
          Your Message
        </label>
      </div>
      
      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-800 dark:text-green-200">
          <p className="font-medium">Message sent successfully!</p>
          <p className="text-sm">We'll get back to you within 24 hours.</p>
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Failed to send message</p>
          <p className="text-sm">Please try again or contact us directly.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="submit-btn bg-transparent text-primary border-2 border-primary py-3 px-8 text-base rounded-lg cursor-pointer transition-all duration-300 w-full hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
} 