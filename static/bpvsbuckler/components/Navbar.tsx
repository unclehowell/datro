import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Warehouse, History, FileText, Newspaper, Gavel, Edit, Scale, BookOpen } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Determine which page to edit based on current route
  const getEditLink = () => {
    if (location.pathname === '/press') return '/edit?page=press';
    return '/edit?page=home';
  };

  const navItems = [
    { name: 'Investigation', path: '/', icon: Warehouse },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Lawsuit', path: '/lawsuit', icon: Scale },
    { name: 'Case Analysis', path: '/analysis', icon: BookOpen },
    { name: 'Press', path: '/press', icon: Newspaper },
    { name: 'Legal Malfeasance', path: '/legal', icon: Gavel },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-justice-red flex items-center justify-center rounded-sm">
                <Warehouse size={18} className="text-white" />
            </div>
            <Link to="/" className="font-serif font-bold text-lg tracking-wider text-white">
              GREAT HOUSE <span className="text-justice-red">FARM</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-[11px] lg:text-xs font-bold uppercase tracking-wide transition-all ${
                    isActive(item.path)
                      ? 'bg-slate-800 text-white border-b-2 border-justice-red'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={14} />
                  {item.name}
                </Link>
              ))}
              <Link
                to={getEditLink()}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 ml-6 transition-all"
              >
                <Edit size={12} />
                Edit Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;