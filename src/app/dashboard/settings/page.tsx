'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Save,
  Camera,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  
  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  
  // Profile update state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });
  
  // Newsletter subscription state
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const [newsletterLoading, setNewsletterLoading] = useState(false);




  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('Loading profile for user:', user);
        const response = await fetch('/api/user/profile');
        console.log('Profile API response:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Profile data received:', data);
          if (data.profile) {
            setFormData({
              name: data.profile.name || user?.name || '',
              email: data.profile.email || user?.email || '',
              phone: data.profile.phone || '',
              dateOfBirth: data.profile.date_of_birth || '',
              gender: data.profile.gender || '',
              address: data.profile.address || ''
            });
          }
        } else {
          console.error('Failed to load profile:', response.status);
        }
        
        // Load newsletter subscription status separately
        try {
          const newsletterResponse = await fetch('/api/user/newsletter');
          if (newsletterResponse.ok) {
            const newsletterData = await newsletterResponse.json();
            setNewsletterSubscribed(newsletterData.subscribed);
          }
        } catch (error) {
          console.error('Error loading newsletter status:', error);
          // Default to false if we can't determine status
          setNewsletterSubscribed(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileMessage('Error loading profile data');
      } finally {
        setLoadingProfile(false);
      }
    };

    console.log('useEffect - user:', user, 'loading:', loading);
    if (user && !loading) {
      loadProfile();
    } else if (!loading) {
      setLoadingProfile(false);
      if (!user) {
        setProfileMessage('Please log in to view your profile');
      }
    }
  }, [user, loading]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };





  const handleSave = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfileMessage('Profile updated successfully!');
        setIsEditing(false);
        console.log('Profile updated successfully:', data);
      } else {
        setProfileMessage(data.error || 'Failed to update profile');
        console.error('Failed to update profile:', data.error);
      }
    } catch (error) {
      setProfileMessage('An error occurred while updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage('');
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage('All password fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters long');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordMessage(data.error || 'Failed to update password');
      }
    } catch (error) {
      setPasswordMessage('An error occurred while updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMessage('');
    
    if (!deletePassword) {
      setDeleteMessage('Password is required to delete account');
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDeleteMessage('Account deleted successfully. Redirecting...');
        // Redirect to home page after successful deletion
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setDeleteMessage(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setDeleteMessage('An error occurred while deleting account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNewsletterToggle = async () => {
    setNewsletterLoading(true);
    
    try {
      const response = await fetch('/api/user/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribed: !newsletterSubscribed,
        }),
      });
      
      if (response.ok) {
        setNewsletterSubscribed(!newsletterSubscribed);
        setProfileMessage(
          !newsletterSubscribed 
            ? 'Successfully subscribed to newsletter!' 
            : 'Successfully unsubscribed from newsletter!'
        );
        // Clear message after 3 seconds
        setTimeout(() => setProfileMessage(''), 3000);
      } else {
        setProfileMessage('Failed to update newsletter subscription');
      }
    } catch (error) {
      setProfileMessage('An error occurred while updating newsletter subscription');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> }
  ];

  return (
    <>
      <Head>
        <title>Profile Settings | Trek Hub India</title>
        <meta name="description" content="Manage your profile settings and preferences" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
                <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and information</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 dark:border-blue-800">
                      {user?.avatar_url ? (
                        <Image src={user.avatar_url} alt="avatar" width={96} height={96} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                          <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {formData.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {formData.email}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Personal Information */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h3>
                
                {profileMessage && (
                  <div className={`p-3 rounded-lg text-sm mb-4 ${
                    profileMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {profileMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Cannot be changed)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    >
                      <option value="">Select your gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </Card>



              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={profileLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
              
              {/* Newsletter Subscription */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Newsletter Preferences
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Newsletter Subscription</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {newsletterSubscribed 
                        ? 'Receive updates about new treks, offers, and travel tips'
                        : 'You are currently unsubscribed from our newsletter'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      newsletterSubscribed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {newsletterSubscribed ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                    <Button
                      onClick={handleNewsletterToggle}
                      disabled={newsletterLoading}
                      variant={newsletterSubscribed ? "outline" : "default"}
                      size="sm"
                      className={newsletterSubscribed 
                        ? "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {newsletterLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          {newsletterSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                        </>
                      ) : (
                        newsletterSubscribed ? 'Unsubscribe' : 'Subscribe'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  {passwordMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      passwordMessage.includes('successfully') 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {passwordMessage}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </Card>


              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Account Actions
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">Download Your Data</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Get a copy of all your data
                      </p>
                    </div>
                    <Button variant="outline">
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 dark:text-red-400 font-medium">Delete Account</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteModal(true)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Delete Account
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. This will permanently delete your account and all associated data.
            </p>
            
            {deleteMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                deleteMessage.includes('successfully') 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {deleteMessage}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to confirm deletion:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteMessage('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
