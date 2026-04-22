import AnimatedOutlet from '@/components/layout/AnimatedOutlet';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Navbar from '@/components/layout/Navbar';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function CLayout() {
  useAnalytics();
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <a className="skip-to-main" href="#main-content">
        跳转到主要内容
      </a>
      <Navbar />
      <main className="min-h-screen pt-16 pb-24 lg:pb-0" id="main-content">
        <AnimatedOutlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
