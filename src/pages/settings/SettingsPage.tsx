import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { updateProfileAPI } from '../../api/users';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    website: user?.website || '',
    startupName: user?.startupName || '',
    industry: user?.industry || '',
    fundingNeeded: user?.fundingNeeded || 0,
    startupStage: user?.startupStage || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await updateProfileAPI(form);
      await updateProfile(user?.id || '', {
        ...form,
        avatarUrl: user?.avatarUrl || '',
        id: user?.id || '',
        email: user?.email || '',
        role: user?.role || 'entrepreneur',
        createdAt: user?.createdAt || '',
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Update your profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><h2 className="text-lg font-medium text-gray-900">Basic Information</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tell us about yourself..."
              />
            </div>
            <Input
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              fullWidth
              placeholder="City, Country"
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              placeholder="+1 234 567 8900"
            />
            <Input
              label="Website"
              name="website"
              value={form.website}
              onChange={handleChange}
              fullWidth
              placeholder="https://yoursite.com"
            />
          </CardBody>
        </Card>

        {/* Role-specific */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">
              {user?.role === 'entrepreneur' ? 'Startup Details' : 'Investment Details'}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {user?.role === 'entrepreneur' && (
              <>
                <Input
                  label="Startup Name"
                  name="startupName"
                  value={form.startupName}
                  onChange={handleChange}
                  fullWidth
                />
                <Input
                  label="Industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  fullWidth
                  placeholder="FinTech, HealthTech, etc."
                />
                <Input
                  label="Funding Needed ($)"
                  name="fundingNeeded"
                  type="number"
                  value={form.fundingNeeded.toString()}
                  onChange={handleChange}
                  fullWidth
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Startup Stage</label>
                  <select
                    name="startupStage"
                    value={form.startupStage}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select stage</option>
                    <option value="idea">Idea</option>
                    <option value="mvp">MVP</option>
                    <option value="growth">Growth</option>
                    <option value="scaling">Scaling</option>
                  </select>
                </div>
              </>
            )}

            {user?.role === 'investor' && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Investment profile settings coming soon.</p>
                <p className="text-gray-400 text-xs mt-1">Update your focus areas and investment range.</p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-2">Account Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};
