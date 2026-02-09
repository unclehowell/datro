import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, History, FileText, Newspaper, Gavel, Edit } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Case Overview', path: '/', icon: Scale },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Legal Analysis', path: '/legal', icon: Gavel },
    { name: 'Archive Evidence', path: '/evidence', icon: Newspaper },
    { name: 'Action Plan', path: '/action', icon: FileText },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-justice-red text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-serif font-bold text-xl tracking-wider">
              THE BUCKLER CASE
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-red-900 text-white'
                      : 'text-red-100 hover:bg-red-800'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              ))}
              <Link
                to="/edit"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-200 hover:text-white hover:bg-red-800 transition-colors border border-red-800 ml-4"
              >
                <Edit size={14} />
                Edit Site
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu could go here, keeping simple for now */}
    </nav>
  );
};

export default Navbar;