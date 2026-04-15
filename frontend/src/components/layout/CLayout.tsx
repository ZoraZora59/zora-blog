import { Outlet } from 'react-router-dom';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Navbar from '@/components/layout/Navbar';

export default function CLayout() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <Navbar />
      <main className="min-h-screen pt-16 pb-24 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
