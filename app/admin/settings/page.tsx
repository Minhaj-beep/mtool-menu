// UI CHANGE: Enhanced settings page with better form layout, improved spacing, and visual hierarchy
'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import { toast } from 'sonner';
import { Save, Upload, X, Link as LinkIcon } from 'lucide-react';

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    google_place_id: '',
    theme_color: '#000000',
    logo_url: '',
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: restaurantData, error } =
        await supabaseBrowser
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

      if (error || !restaurantData) {
        throw new Error('Restaurant not found');
      }

      setRestaurant(restaurantData);

      setFormData({
        name: restaurantData.name,
        google_place_id: restaurantData.google_place_id ?? '',
        theme_color: restaurantData.theme_color ?? '#000000',
        logo_url: restaurantData.logo_url ?? '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const presignedResponse = await fetch(
        '/api/upload/presigned-url',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        }
      );

      const presignedData = await presignedResponse.json();

      if (!presignedResponse.ok) {
        throw new Error(presignedData.error);
      }

      const uploadResponse = await fetch(
        presignedData.uploadUrl,
        {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      setFormData((prev) => ({
        ...prev,
        logo_url: presignedData.fileUrl,
      }));

      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo_url: '',
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Settings saved successfully');
      setRestaurant(data.restaurant);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  /* ================= Guards ================= */

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 text-center">
            No restaurant found. Please set up your restaurant first.
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-slate-600 mt-2 text-base">
          Manage your restaurant settings and branding
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Restaurant Information</CardTitle>
          <CardDescription className="text-base">
            Update your restaurant details and appearance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Restaurant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Restaurant Logo</Label>
            <p className="text-xs text-slate-500">Upload your restaurant logo (max 5MB)</p>
            <div className="mt-2">
              {formData.logo_url ? (
                <div className="flex items-center gap-4">
                  <img
                    src={formData.logo_url}
                    alt="Restaurant logo"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo || saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={uploadingLogo || saving}
                    className="hover:bg-slate-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo
                      ? 'Uploading...'
                      : 'Upload Logo'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              URL Slug
            </Label>
            <Input value={restaurant.slug} disabled className="bg-slate-50" />
            <p className="text-xs text-slate-500">
              Your menu URL: <span className="font-mono">/menu/{restaurant.slug}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_place_id" className="text-sm font-semibold">Google Place ID</Label>
            <Input
              id="google_place_id"
              value={formData.google_place_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  google_place_id: e.target.value,
                })
              }
              placeholder="Optional: Enter your Google Place ID"
              className="text-base"
            />
            <p className="text-xs text-slate-500">
              Used for Google review integration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme_color" className="text-sm font-semibold">Theme Color</Label>
            <p className="text-xs text-slate-500">Choose your brand color for the menu</p>
            <div className="flex gap-3 items-center">
              <Input
                id="theme_color"
                type="color"
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color: e.target.value,
                  })
                }
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color: e.target.value,
                  })
                }
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
