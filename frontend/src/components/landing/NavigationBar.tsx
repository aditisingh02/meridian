import Link from "next/link";

export default function NavigationBar() {
  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-full px-2 py-2 shadow-sm shadow-black/5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[9px] font-bold">
            M
          </span>
          Meridian
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Nav links */}
        <Link href="#how-it-works" className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium">
          How it works
        </Link>
        <Link href="#features" className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium">
          Features
        </Link>
        <Link href="#integrations" className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium hidden md:block">
          Integrations
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* CTA */}
        <Link
          href="/dashboard"
          className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
