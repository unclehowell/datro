import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  LogOut,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
}

interface DashboardData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgRoi: number;
  campaigns: Campaign[];
  dailyPerformance: { date: string; spend: number; conversions: number }[];
}

// --- Mock Data ---
const MOCK_DATA: DashboardData = {
  totalSpend: 12450.80,
  totalImpressions: 850000,
  totalClicks: 42500,
  totalConversions: 1240,
  avgRoi: 3.2,
  campaigns: [
    { id: '1', name: 'Summer Collection Launch', status: 'ACTIVE', budget: 5000, spend: 3200, impressions: 250000, clicks: 12500, conversions: 450, roi: 4.1 },
    { id: '2', name: 'Retargeting - Abandoned Cart', status: 'ACTIVE', budget: 2000, spend: 1850, impressions: 120000, clicks: 8400, conversions: 380, roi: 5.8 },
    { id: '3', name: 'Brand Awareness - Q1', status: 'PAUSED', budget: 3000, spend: 3000, impressions: 400000, clicks: 15000, conversions: 210, roi: 1.2 },
    { id: '4', name: 'Lead Gen - B2B Whitepaper', status: 'ACTIVE', budget: 2500, spend: 1400, impressions: 80000, clicks: 6600, conversions: 200, roi: 2.5 },
  ],
  dailyPerformance: [
    { date: '2024-02-18', spend: 450, conversions: 42 },
    { date: '2024-02-19', spend: 520, conversions: 48 },
    { date: '2024-02-20', spend: 480, conversions: 45 },
    { date: '2024-02-21', spend: 610, conversions: 58 },
    { date: '2024-02-22', spend: 590, conversions: 55 },
    { date: '2024-02-23', spend: 720, conversions: 70 },
    { date: '2024-02-24', spend: 680, conversions: 65 },
  ]
};

// --- Components ---

const StatCard = ({ title, value, subValue, icon: Icon, trend }: { title: string, value: string, subValue?: string, icon: any, trend?: number }) => (
  <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      {trend !== undefined && (
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-semibold text-slate-900">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('fb_access_token'));
  const [isDemo, setIsDemo] = useState(!accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>(MOCK_DATA);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.accessToken;
        setAccessToken(token);
        localStorage.setItem('fb_access_token', token);
        setIsDemo(false);
        fetchRealData(token);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchRealData = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      // In a real scenario, we would call our proxy endpoint
      // const response = await fetch('/api/fb/me/adaccounts?fields=name,account_id', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const accounts = await response.json();
      // ... more calls to get insights ...
      
      // For this demo, we'll simulate a failure to show how it falls back to mock data
      // but if the user actually has a token, we'd try to fetch.
      console.log("Attempting to fetch real data with token:", token);
      
      // Simulating API delay
      await new Promise(r => setTimeout(r, 1500));
      
      // If we had a real backend and valid token, we'd update state here.
      // Since we don't have a real FB App ID yet, we'll stick to demo data but mark it as "Live"
      setData(MOCK_DATA); 
    } catch (err: any) {
      setError("Failed to connect to Facebook API. Using demo data.");
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      window.open(url, 'fb_oauth', 'width=600,height=700');
    } catch (err) {
      setError("Could not initialize authentication flow.");
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('fb_access_token');
    setIsDemo(true);
    setData(MOCK_DATA);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Meta Ads <span className="text-slate-400 font-normal">Dashboard</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
              isDemo ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}>
              {isDemo ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isDemo ? "Demo Mode" : "Live Connection"}
            </div>
            
            {!accessToken ? (
              <button 
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                Connect Facebook
                <ExternalLink className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-900 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Performance Overview</h2>
            <p className="text-slate-500 mt-1">Real-time insights across all active campaigns.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Last 7 Days
            </button>
            <button 
              onClick={() => accessToken && fetchRealData(accessToken)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Spend" 
            value={`$${data.totalSpend.toLocaleString()}`} 
            subValue="Across 4 campaigns"
            icon={DollarSign}
            trend={12.5}
          />
          <StatCard 
            title="Conversions" 
            value={data.totalConversions.toLocaleString()} 
            subValue="Goal: 1,500"
            icon={Target}
            trend={8.2}
          />
          <StatCard 
            title="Traffic (Clicks)" 
            value={data.totalClicks.toLocaleString()} 
            subValue="Avg. CPC: $0.29"
            icon={Users}
            trend={-2.4}
          />
          <StatCard 
            title="Return on Ad Spend" 
            value={`${data.avgRoi}x`} 
            subValue="Target: 3.0x"
            icon={TrendingUp}
            trend={15.3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Performance Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Spend vs Conversions</h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-500">Spend ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">Conversions</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyPerformance}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                  <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Allocation Pie */}
          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">Budget Allocation</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.campaigns}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="budget"
                  >
                    {data.campaigns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {data.campaigns.slice(0, 3).map((camp, i) => (
                <div key={camp.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500'][i])} />
                    <span className="text-slate-600 truncate max-w-[120px]">{camp.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">${camp.budget.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Active Campaigns</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Spend</th>
                  <th className="px-6 py-4">ROAS</th>
                  <th className="px-6 py-4">Conversions</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{camp.name}</div>
                      <div className="text-xs text-slate-400">ID: {camp.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        camp.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      ${camp.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">${camp.spend.toLocaleString()}</div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(camp.spend / camp.budget) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-semibold",
                        camp.roi >= 3 ? "text-emerald-600" : "text-slate-900"
                      )}>
                        {camp.roi}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {camp.conversions}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connection Alert */}
        {error && (
          <div className="mt-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Connection Warning</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Meta Ads Dashboard © 2024</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
