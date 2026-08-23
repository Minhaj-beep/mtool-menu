// UI CHANGE: Enhanced settings page with Google Place ID instructions + YouTube video
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Restaurant } from '@/lib/types/database';
import { toast } from 'sonner';
import {
  Save,
  Upload,
  X,
  Link as LinkIcon,
  ExternalLink,
  HelpCircle,
  Phone,
  Plus,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  MessageCircle,
  Clock,
  BookOpen,
  Images,
  Trash2,
  Loader2,
} from 'lucide-react';
import { WEEKDAYS, DEFAULT_DAY_HOURS } from '@/lib/utils/opening-hours';
import type { OpeningHours, SocialLinks, GalleryImage } from '@/lib/types/database';
import { MAX_GALLERY_IMAGES } from '@/lib/types/database';

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; icon: any; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourpage' },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://x.com/yourpage' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+91 90000 00000' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
];

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    google_place_id: '',
    theme_color: '#000000',
    secondary_theme_color: '#ffffff',
    font_family: 'Inter',
    logo_url: '',
    banner_image_url: '',
    background_image_url: '',
    button_style: 'rounded',
    card_style: 'shadow',
    menu_layout: 'grid',
    dark_mode: false,
    theme_preset: 'custom',
    contact_numbers: [] as string[],
    social_links: {} as SocialLinks,
    opening_hours: {} as OpeningHours,
    show_contact_numbers: true,
    show_social_media: true,
    show_price: true,
    about_us: '',
    show_about_us: true,
    gallery_images: [] as GalleryImage[],
  });

  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  /* ================= Load ================= */

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseBrowser
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error || !data)
        throw new Error('Restaurant not found');

      setRestaurant(data);

      setFormData({
        name: data.name,
        google_place_id: data.google_place_id ?? '',
        theme_color: data.theme_color ?? '#000000',
        secondary_theme_color:
          data.secondary_theme_color ?? '#ffffff',
        font_family: data.font_family ?? 'Inter',
        logo_url: data.logo_url ?? '',
        banner_image_url: data.banner_image_url ?? '',
        background_image_url:
          data.background_image_url ?? '',
        button_style: data.button_style ?? 'rounded',
        card_style: data.card_style ?? 'shadow',
        menu_layout: data.menu_layout ?? 'grid',
        dark_mode: data.dark_mode ?? false,
        theme_preset: data.theme_preset ?? 'custom',
        contact_numbers: data.contact_numbers ?? [],
        social_links: data.social_links ?? {},
        opening_hours: data.opening_hours ?? {},
        show_contact_numbers: data.show_contact_numbers ?? true,
        show_social_media: data.show_social_media ?? true,
        show_price: data.show_price ?? true,
        about_us: data.about_us ?? '',
        show_about_us: data.show_about_us ?? true,
        gallery_images: data.gallery_images ?? [],
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  /* ================= Logo Upload ================= */

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'banner_image_url' | 'background_image_url'
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

    setUploadingImage(true);

    try {
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const presignedData = await presignedResponse.json();

      if (!presignedResponse.ok) throw new Error(presignedData.error);

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      setFormData((prev) => ({
        ...prev,
        [field]: presignedData.fileUrl,
      }));

      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };


  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo_url: '',
    }));
  };

  /* ================= Gallery ================= */

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const slotsRemaining = MAX_GALLERY_IMAGES - formData.gallery_images.length;
    if (slotsRemaining <= 0) {
      toast.error(`You can only have up to ${MAX_GALLERY_IMAGES} gallery photos`);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }
    }

    let validFiles = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );

    if (validFiles.length > slotsRemaining) {
      toast.error(
        `Only ${slotsRemaining} more photo${slotsRemaining === 1 ? '' : 's'} allowed (max ${MAX_GALLERY_IMAGES}) — uploading the first ${slotsRemaining}`
      );
      validFiles = validFiles.slice(0, slotsRemaining);
    }

    if (validFiles.length === 0) {
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    setUploadingGalleryImage(true);

    try {
      const uploaded: GalleryImage[] = [];

      for (const file of validFiles) {
        const presignedResponse = await fetch('/api/gallery/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        const presignedData = await presignedResponse.json();
        if (!presignedResponse.ok) throw new Error(presignedData.error);

        const uploadResponse = await fetch(presignedData.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadResponse.ok) throw new Error('Upload failed');

        uploaded.push({ url: presignedData.fileUrl, key: presignedData.key });
      }

      setFormData((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...uploaded],
      }));

      toast.success(
        uploaded.length > 1 ? `${uploaded.length} photos uploaded` : 'Photo uploaded'
      );
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingGalleryImage(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = async (image: GalleryImage) => {
    // Optimistically remove from UI
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((img) => img.key !== image.key),
    }));

    try {
      const response = await fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: image.key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRestaurant(data.restaurant);
      toast.success('Photo removed');
    } catch (err: any) {
      // Roll back on failure
      setFormData((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, image],
      }));
      toast.error(err.message || 'Failed to remove photo');
    }
  };

  /* ================= Contact Numbers ================= */

  const handleAddContactNumber = () => {
    if (formData.contact_numbers.length >= 2) {
      toast.error('You can only add up to 2 contact numbers');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      contact_numbers: [...prev.contact_numbers, ''],
    }));
  };

  const handleContactNumberChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_numbers: prev.contact_numbers.map((n, i) => (i === index ? value : n)),
    }));
  };

  const handleRemoveContactNumber = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contact_numbers: prev.contact_numbers.filter((_, i) => i !== index),
    }));
  };

  /* ================= Social Links ================= */

  const handleSocialLinkChange = (key: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value },
    }));
  };

  /* ================= Opening Hours ================= */

  const handleToggleDayClosed = (dayKey: string, closed: boolean) => {
    setFormData((prev) => {
      const existing = prev.opening_hours[dayKey as keyof OpeningHours] ?? DEFAULT_DAY_HOURS;
      return {
        ...prev,
        opening_hours: {
          ...prev.opening_hours,
          [dayKey]: { ...existing, closed },
        },
      };
    });
  };

  const handleDayTimeChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    setFormData((prev) => {
      const existing = prev.opening_hours[dayKey as keyof OpeningHours] ?? DEFAULT_DAY_HOURS;
      return {
        ...prev,
        opening_hours: {
          ...prev.opening_hours,
          [dayKey]: { ...existing, [field]: value },
        },
      };
    });
  };

  const handleApplyToAllDays = () => {
    const monday = formData.opening_hours.monday ?? DEFAULT_DAY_HOURS;
    const updated: OpeningHours = {};
    WEEKDAYS.forEach(({ key }) => {
      updated[key] = { ...monday };
    });
    setFormData((prev) => ({ ...prev, opening_hours: updated }));
    toast.success('Applied Monday\'s hours to every day');
  };

  /* ================= Save ================= */

  const handleSave = async () => {
    setSaving(true);

    try {
      const cleanedContactNumbers = formData.contact_numbers
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 2);

      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(formData.social_links).filter(([, v]) => !!(v && v.trim()))
      );

      const payload = {
        ...formData,
        contact_numbers: cleanedContactNumbers,
        social_links: cleanedSocialLinks,
      };

      const response = await fetch(
        '/api/restaurant',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error);

      setRestaurant(data.restaurant);
      setFormData((prev) => ({
        ...prev,
        contact_numbers: cleanedContactNumbers,
        social_links: cleanedSocialLinks,
      }));

      toast.success('Saved successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= Guards ================= */

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return <div>No restaurant found</div>;
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Business Information
          </CardTitle>
          <CardDescription>
            Update branding and integrations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>

            {formData.logo_url ? (
              <div className="flex gap-4 items-center">
                <img
                  src={formData.logo_url}
                  className="w-20 h-20 rounded border"
                />

                <Button
                  variant="outline"
                  onClick={handleRemoveLogo}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'logo_url')}
                />

                <Button
                  variant="outline"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
              </>
            )}
          </div>


          {/* Banner Image */}
          <div className="space-y-2">
            <Label>Banner Image</Label>

            {formData.banner_image_url && (
              <img
                src={formData.banner_image_url}
                className="w-full h-40 object-cover rounded-lg border"
                alt="Banner"
              />
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={(e)=>handleImageUpload(e,'banner_image_url')}
            />
          </div>

          {/* Background Image */}
          {/* <div className="space-y-2">
            <Label>Background Image</Label>

            {formData.background_image_url && (
              <img
                src={formData.background_image_url}
                className="w-full h-40 object-cover rounded-lg border"
                alt="Background"
              />
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={(e)=>handleImageUpload(e,'background_image_url')}
            />
          </div> */}

          {/* URL Slug */}
          <div className="space-y-2">
            <Label>Menu URL</Label>

            <Input
              value={`/menu/${restaurant.slug}`}
              disabled
            />
          </div>

          {/* CONTACT NUMBERS */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className="flex gap-2 items-center text-base">
                <Phone className="w-4 h-4" />
                Contact Numbers
              </Label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show on menu</span>
                <input
                  type="checkbox"
                  checked={formData.show_contact_numbers}
                  onChange={(e) =>
                    setFormData({ ...formData, show_contact_numbers: e.target.checked })
                  }
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Add up to 2 phone numbers customers can tap to call from your menu.
            </p>

            <div className="space-y-2">
              {formData.contact_numbers.map((number, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={number}
                    placeholder="+91 90000 00000"
                    onChange={(e) => handleContactNumberChange(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveContactNumber(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {formData.contact_numbers.length < 2 && (
                <Button type="button" variant="outline" onClick={handleAddContactNumber}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact Number
                </Button>
              )}
            </div>
          </div>

          {/* SOCIAL LINKS */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className="flex gap-2 items-center text-base">
                <LinkIcon className="w-4 h-4" />
                Social Media Links
              </Label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show on menu</span>
                <input
                  type="checkbox"
                  checked={formData.show_social_media}
                  onChange={(e) =>
                    setFormData({ ...formData, show_social_media: e.target.checked })
                  }
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Add links to your social profiles. Leave a field blank to hide that icon.
            </p>

            <div className="space-y-2">
              {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="flex gap-2 items-center">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    value={formData.social_links[key] ?? ''}
                    placeholder={`${label} — ${placeholder}`}
                    onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* OPENING HOURS */}
          <div className="space-y-3 border-t pt-6">
            <Label className="flex gap-2 items-center text-base">
              <Clock className="w-4 h-4" />
              Opening Hours
            </Label>

            <p className="text-sm text-muted-foreground">
              Set your hours for each day. Customers will see this on your public menu.
            </p>

            <div className="space-y-2">
              {WEEKDAYS.map(({ key, label }) => {
                const day = formData.opening_hours[key] ?? DEFAULT_DAY_HOURS;
                return (
                  <div key={key} className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="w-24 text-sm font-medium shrink-0">{label}</span>

                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      <input
                        type="checkbox"
                        checked={!day.closed}
                        onChange={(e) => handleToggleDayClosed(key, !e.target.checked)}
                      />
                      Open
                    </label>

                    {!day.closed ? (
                      <>
                        <Input
                          type="time"
                          value={day.open}
                          onChange={(e) => handleDayTimeChange(key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={day.close}
                          onChange={(e) => handleDayTimeChange(key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={handleApplyToAllDays}>
              Copy Monday's hours to all days
            </Button>
          </div>

          {/* GOOGLE PLACE ID SECTION */}
          <div className="space-y-3">

            <Label className="flex gap-2 items-center">
              Google Place ID
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Label>

            <Input
              value={formData.google_place_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  google_place_id:
                    e.target.value,
                })
              }
              placeholder="Enter Google Place ID"
            />

            {/* Instructions */}
            <div className="bg-slate-50 border rounded-lg p-4 space-y-3">

              <p className="text-sm font-medium">
                How to find your Google Place ID:
              </p>

              <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
                <li>
                  Open Google Place ID Finder
                </li>
                <li>
                  Search your place name
                </li>
                <li>
                  Click your place
                </li>
                <li>
                  Copy the Place ID
                </li>
                <li>
                  Paste it above
                </li>
              </ol>

              {/* Direct link */}
              <a
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                target="_blank"
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                Open Google Place ID Finder
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>

              {/* YouTube video */}
              <div className="pt-3">
                <p className="text-sm font-medium mb-2">
                  Video tutorial:
                </p>

                <div className="aspect-video rounded overflow-hidden border">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/hkPQ36UXF28"
                    title="How to find Google Place ID"
                    allowFullScreen
                  />
                </div>
              </div>

            </div>

          </div>
          

          {/* Theme Preset */}
          <div className="space-y-2">
            <Label>Theme Preset</Label>

            <select
              className="w-full border rounded-md h-10 px-3"
              value={formData.theme_preset}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  theme_preset: e.target.value,
                })
              }
            >
              <option value="custom">Custom</option>
              <option value="minimal">Minimal</option>
              <option value="modern">Modern</option>
              <option value="luxury">Luxury</option>
              <option value="coffee">Coffee</option>
              <option value="elegant">Elegant</option>
              <option value="dark">Dark</option>
            </select>

            <p className="text-sm text-muted-foreground">
              Choose a professionally designed theme. You can still customize colors, fonts and layout afterward.
            </p>
          </div>

          {/* Theme Color */}
          <div className="space-y-2">
            <Label>Theme Color</Label>

            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color:
                      e.target.value,
                  })
                }
                className="w-20"
              />

              <Input
                value={formData.theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    theme_color:
                      e.target.value,
                  })
                }
              />
            </div>
          </div>
          
          {/* Secondary Theme Color */}
          <div className="space-y-2">
            <Label>Secondary Theme Color</Label>

            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.secondary_theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondary_theme_color: e.target.value,
                  })
                }
                className="w-20"
              />

              <Input
                value={formData.secondary_theme_color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondary_theme_color: e.target.value,
                  })
                }
              />
            </div>
          </div>
          
          {/* Font Family */}
          <div className="space-y-2">
            <Label>Font</Label>

            <select
              className="w-full border rounded-md h-10 px-3"
              value={formData.font_family}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  font_family: e.target.value,
                })
              }
            >
              <option>Inter</option>
              <option>Poppins</option>
              <option>Roboto</option>
              <option>Montserrat</option>
              <option>Open Sans</option>
              <option>Lato</option>
              <option>Nunito</option>
              <option>Playfair Display</option>
            </select>
          </div>

          {/* Button Style */}
          <div className="space-y-2">
            <Label>Button Style</Label>

            <select
              className="w-full border rounded-md h-10 px-3"
              value={formData.button_style}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  button_style: e.target.value,
                })
              }
            >
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
              <option value="square">Square</option>
            </select>
          </div>

          {/* Card Style */}
          <div className="space-y-2">
            <Label>Card Style</Label>

            <select
              className="w-full border rounded-md h-10 px-3"
              value={formData.card_style}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  card_style: e.target.value,
                })
              }
            >
              <option value="shadow">Shadow</option>
              <option value="flat">Flat</option>
              <option value="outlined">Outlined</option>
              <option value="glass">Glass</option>
            </select>
          </div>

          {/* Menu Layout */}
          <div className="space-y-2">
            <Label>Menu Layout</Label>

            <select
              className="w-full border rounded-md h-10 px-3"
              value={formData.menu_layout}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  menu_layout: e.target.value,
                })
              }
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <Label>Dark Mode</Label>

            <input
              type="checkbox"
              checked={formData.dark_mode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dark_mode: e.target.checked,
                })
              }
            />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <Label>Show Price</Label>

            <input
              type="checkbox"
              checked={formData.show_price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  show_price: e.target.checked,
                })
              }
            />
          </div>

          {/* ================= About Us ================= */}
          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">About Us</h3>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_about_us">Show About Us on menu page</Label>
              <Switch
                id="show_about_us"
                checked={formData.show_about_us}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_about_us: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_us">Tell customers about your restaurant</Label>
              <Textarea
                id="about_us"
                placeholder="Share your story, cuisine, or what makes your restaurant special..."
                rows={5}
                value={formData.about_us}
                onChange={(e) =>
                  setFormData({ ...formData, about_us: e.target.value })
                }
              />
            </div>
          </div>

          {/* ================= Gallery ================= */}
          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Gallery</h3>
              <span className="text-sm text-muted-foreground ml-auto">
                {formData.gallery_images.length}/{MAX_GALLERY_IMAGES}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload up to {MAX_GALLERY_IMAGES} photos of your restaurant, ambience, or dishes to show on your public menu page.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {formData.gallery_images.map((img) => (
                <div key={img.key} className="relative group aspect-square rounded-lg overflow-hidden border">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(img)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {formData.gallery_images.length < MAX_GALLERY_IMAGES && (
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={uploadingGalleryImage}
                  className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {uploadingGalleryImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span className="text-xs">
                    {uploadingGalleryImage ? 'Uploading...' : 'Add photos'}
                  </span>
                </button>
              )}
            </div>

            {formData.gallery_images.length >= MAX_GALLERY_IMAGES && (
              <p className="text-xs text-muted-foreground">
                You've reached the {MAX_GALLERY_IMAGES}-photo limit. Remove a photo to add a new one.
              </p>
            )}

            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryImageUpload}
            />
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />

            {saving
              ? 'Saving...'
              : 'Save Changes'}
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
