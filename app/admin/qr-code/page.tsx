'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { Download, QrCode, Link as LinkIcon } from 'lucide-react';

export default function QRCodePage() {
  const [qrCode, setQrCode] = useState<string>('');
  const [menuUrl, setMenuUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setQrCode(data.qrCode);
      setMenuUrl(data.menuUrl);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'menu-qr-code.png';
    link.click();
    toast.success('QR code downloaded');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Menu URL copied to clipboard');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">QR Code</h1>
        <p className="text-slate-500 mt-1">Download your menu QR code</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Menu QR Code</CardTitle>
          <CardDescription>
            Customers can scan this QR code to view your digital menu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
          ) : (
            <>
              {qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
                    <img src={qrCode} alt="Menu QR Code" className="w-64 h-64" />
                  </div>
                  <Button onClick={downloadQR} size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Menu URL
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={menuUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-slate-50"
                  />
                  <Button onClick={copyUrl} variant="outline">
                    Copy
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Tips for using your QR code:</h4>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Print and place on tables, counters, or at the entrance</li>
                  <li>Include in promotional materials and flyers</li>
                  <li>Share on social media and your website</li>
                  <li>Test the QR code before printing to ensure it works</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
