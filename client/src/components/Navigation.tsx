import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Menu, X, Ambulance, LogOut } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [driverName, setDriverName] = useState("");

  // Check localStorage for active driver session on every render
  useEffect(() => {
    const checkDriver = () => {
      const saved = localStorage.getItem("currentDriver");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setIsDriverLoggedIn(true);
          setDriverName(parsed.displayName || "Driver");
        } catch {
          setIsDriverLoggedIn(false);
          setDriverName("");
        }
      } else {
        setIsDriverLoggedIn(false);
        setDriverName("");
      }
    };

    checkDriver();

    // Listen for storage changes (e.g. login/logout in Driver.tsx)
    window.addEventListener("storage", checkDriver);
    // Also poll every 500ms for same-tab changes (localStorage doesn't fire 'storage' in same tab)
    const interval = setInterval(checkDriver, 500);
    return () => {
      window.removeEventListener("storage", checkDriver);
      clearInterval(interval);
    };
  }, []);

  const customerNavItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/firstaid", label: "First Aid AI" },
    { href: "/hospitals", label: "Hospitals" },
  ];

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "?");

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={isDriverLoggedIn ? "/driver" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="bg-red-600 text-white p-1.5 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-black text-gray-950 tracking-tight">SEVA</span>
            <span className="hidden sm:block text-[11px] text-gray-400 font-medium border border-gray-200 rounded-full px-2 py-0.5">
              {isDriverLoggedIn ? "Driver Dashboard" : "Emergency"}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isDriverLoggedIn ? (
              // Driver is logged in — show only driver identity + link to console
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Ambulance className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">{driverName}</span>
                </div>
                <Link
                  href="/driver"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive("/driver")
                      ? "text-red-600 bg-red-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  My Dashboard
                </Link>
              </div>
            ) : (
              // Customer view — show all nav tabs + Driver Panel button
              <>
                {customerNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/driver"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 ml-3 shadow-sm shadow-red-500/10"
                >
                  Driver Panel
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            {isDriverLoggedIn ? (
              <>
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600">
                  <Ambulance className="h-4 w-4" />
                  {driverName}
                </div>
                <Link
                  href="/driver"
                  className="block px-4 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                {customerNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive(item.href) ? "text-red-600 bg-red-50" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/driver"
                  className="block px-4 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Driver Panel
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
