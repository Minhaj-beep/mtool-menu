import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QrCode, MenuSquare, Zap, Shield, Crown, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <QrCode className="w-8 h-8" />
              <span className="text-xl font-bold">QR Menu</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Digital Menus Made <span className="text-slate-600">Simple</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Create stunning QR-based digital menus for your restaurant. No app downloads required for customers.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose QR Menu?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
                <p className="text-slate-600">
                  Customers scan a QR code and instantly view your menu. No app downloads, no hassle.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
                <p className="text-slate-600">
                  Update your menu anytime. Changes appear instantly on all QR codes.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-slate-600">
                  Enterprise-grade security with 99.9% uptime. Your menu is always available.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-lg border-2 border-slate-200">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0<span className="text-base font-normal text-slate-500">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  <li>1 menu</li>
                  <li>3 categories</li>
                  <li>10 dishes</li>
                  <li>Basic QR code</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border-2 border-slate-900 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <p className="text-3xl font-bold mb-4">$29<span className="text-base font-normal text-slate-500">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  <li>1 menu</li>
                  <li>10 categories</li>
                  <li>50 dishes</li>
                  <li>Dish photos</li>
                  <li>Google reviews</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border-2 border-slate-200">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$79<span className="text-base font-normal text-slate-500">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  <li>Multiple menus</li>
                  <li>Unlimited categories</li>
                  <li>Unlimited dishes</li>
                  <li>Custom branding</li>
                  <li>Analytics</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border-2 border-slate-200">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">$199<span className="text-base font-normal text-slate-500">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  <li>Multiple branches</li>
                  <li>Unlimited everything</li>
                  <li>Custom domain</li>
                  <li>White-label</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to go digital?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of restaurants using QR Menu to modernize their dining experience
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2024 QR Menu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
