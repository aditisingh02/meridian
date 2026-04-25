import HeroSection from "@/components/landing/HeroSection";
import NavigationBar from "@/components/landing/NavigationBar";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <NavigationBar />
      <HeroSection />
    </main>
  );
}
