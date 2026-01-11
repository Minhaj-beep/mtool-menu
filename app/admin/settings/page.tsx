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
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import { toast } from 'sonner';
import { Save, Upload, X } from 'lucide-react';

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

      // ✅ Correct: fetch restaurant by owner_id
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
    return <div>Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="text-sm text-muted-foreground">
        No restaurant found.
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your restaurant settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Update your restaurant details
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Restaurant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Restaurant Logo</Label>
            <div className="mt-2">
              {formData.logo_url ? (
                <div className="flex items-center gap-4">
                  <img
                    src={formData.logo_url}
                    alt="Restaurant logo"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo || saving}
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

          <div>
            <Label>URL Slug</Label>
            <Input value={restaurant.slug} disabled />
            <p className="text-xs text-slate-500 mt-1">
              Your menu URL: /menu/{restaurant.slug}
            </p>
          </div>

          <div>
            <Label>Google Place ID</Label>
            <Input
              value={formData.google_place_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  google_place_id: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Theme Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color: e.target.value,
                  })
                }
                className="w-20"
              />
              <Input
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
