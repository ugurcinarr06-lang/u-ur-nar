import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminView } from '../../types';
import {
  DASHBOARD_KPIS, ANALYTICS_30D, COMPANIES, STORES, MIRRORS, PRODUCTS,
  USERS, SUBSCRIPTION_TIERS, TOP_PRODUCTS, CATEGORIES
} from '../../data';
import { MetricCard, StatusDot, GlassCard, Badge, ProgressBar } from '../../components/shared/GlassCard';
import { LineChart, BarChart, DonutChart } from '../../components/shared/MiniChart';

const NAV_ITEMS: { id: AdminView; icon: string; label: string }[] = [
  { id: 'DASHBOARD', icon: '📊', label: 'Dashboard' },
  { id: 'ANALYTICS', icon: '📈', label: 'Analytics' },
  { id: 'PRODUCTS', icon: '👗', label: 'Products' },
  { id: 'STORES', icon: '🏪', label: 'Stores' },
  { id: 'MIRRORS', icon: '🪞', label: 'Mirrors' },
  { id: 'USERS', icon: '👥', label: 'Users' },
  { id: 'SUBSCRIPTIONS', icon: '💳', label: 'Plans' },
  { id: 'SETTINGS', icon: '⚙️', label: 'Settings' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#8b5cf6'
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#ef4444', COMPANY_ADMIN: '#f59e0b', STORE_MANAGER: '#3b82f6', STAFF: '#22c55e'
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const recent = ANALYTICS_30D.slice(-7);
  const totalVisitors = ANALYTICS_30D.reduce((s, d) => s + d.visitors, 0);
  const totalRevenue = ANALYTICS_30D.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good morning, Alex 👋</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>Here's what's happening across your platform today.</p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-green-400 font-medium">94 Companies Active</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARD_KPIS.map(kpi => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-1">Performance Overview</h3>
          <p className="text-xs mb-4" style={{ color: '#555' }}>Last 30 days</p>
          <LineChart data={ANALYTICS_30D} lines={[
            { key: 'visitors', color: '#3b82f6', label: 'Visitors' },
            { key: 'sessions', color: '#8b5cf6', label: 'Sessions' },
            { key: 'tryOns', color: '#22c55e', label: 'Try-Ons' },
            { key: 'conversions', color: '#f59e0b', label: 'Conversions' },
          ]} height={160} />
        </div>
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold">Category Split</h3>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart segments={[
              { label: 'Dresses', value: 42, color: '#ec4899' },
              { label: 'Jackets', value: 29, color: '#f59e0b' },
              { label: 'Shirts', value: 35, color: '#8b5cf6' },
              { label: 'T-Shirts', value: 48, color: '#3b82f6' },
              { label: 'Other', value: 22, color: '#6b7280' },
            ]} size={130} />
          </div>
        </div>
      </div>

      {/* Top products + Active stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">🔥 Top Try-On Products</h3>
          <div className="flex flex-col gap-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="text-sm font-bold w-5" style={{ color: i < 3 ? '#f59e0b' : '#555' }}>#{i+1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.productName}</span>
                    <span className="text-xs" style={{ color: '#22c55e' }}>{p.conversionRate.toFixed(1)}% CVR</span>
                  </div>
                  <ProgressBar value={p.tryOnCount} max={5000} color="#3b82f6" showValue />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">🏪 Store Activity</h3>
          <div className="flex flex-col gap-3">
            {STORES.slice(0, 5).map(store => (
              <div key={store.id} className="flex items-center gap-3">
                <StatusDot status={store.status} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{store.name}</span>
                    <span className="text-xs font-semibold" style={{ color: '#3b82f6' }}>{store.conversionRate}%</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>{store.city} · {store.activeSessions} active sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Analytics ─────────────────────────────────────────────────────────────────
const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const data = period === '7d' ? ANALYTICS_30D.slice(-7) : ANALYTICS_30D;
  const totals = data.reduce((acc, d) => ({
    visitors: acc.visitors + d.visitors,
    sessions: acc.sessions + d.sessions,
    tryOns: acc.tryOns + d.tryOns,
    conversions: acc.conversions + d.conversions,
    revenue: acc.revenue + d.revenue,
  }), { visitors: 0, sessions: 0, tryOns: 0, conversions: 0, revenue: 0 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {(['7d', '30d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: period === p ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: period === p ? 'white' : '#888',
              }}>
              {p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Visitors', value: totals.visitors.toLocaleString(), color: '#3b82f6' },
          { label: 'Sessions', value: totals.sessions.toLocaleString(), color: '#8b5cf6' },
          { label: 'Try-Ons', value: totals.tryOns.toLocaleString(), color: '#22c55e' },
          { label: 'Conversions', value: totals.conversions.toLocaleString(), color: '#f59e0b' },
          { label: 'Revenue', value: `$${Math.round(totals.revenue / 1000)}K`, color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#555' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions line chart */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-1">Session & Try-On Trend</h3>
        <p className="text-xs mb-4" style={{ color: '#555' }}>Daily breakdown for the selected period</p>
        <LineChart data={data} lines={[
          { key: 'sessions', color: '#8b5cf6', label: 'Sessions' },
          { key: 'tryOns', color: '#22c55e', label: 'Try-Ons' },
        ]} height={180} />
      </div>

      {/* Revenue + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-1">Daily Revenue</h3>
          <p className="text-xs mb-4" style={{ color: '#555' }}>In USD</p>
          <BarChart data={data} metric="revenue" color="#f59e0b" height={140} />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Conversion Funnel</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Store Visitors', value: totals.visitors, color: '#3b82f6', pct: 100 },
              { label: 'Mirror Sessions', value: totals.sessions, color: '#8b5cf6', pct: Math.round(totals.sessions / totals.visitors * 100) },
              { label: 'Virtual Try-Ons', value: totals.tryOns, color: '#22c55e', pct: Math.round(totals.tryOns / totals.visitors * 100) },
              { label: 'Conversions', value: totals.conversions, color: '#f59e0b', pct: Math.round(totals.conversions / totals.visitors * 100) },
            ].map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: '#888' }}>{f.label}</span>
                  <div className="flex gap-3">
                    <span className="text-xs font-bold" style={{ color: f.color }}>{f.value.toLocaleString()}</span>
                    <span className="text-xs" style={{ color: '#555' }}>{f.pct}%</span>
                  </div>
                </div>
                <ProgressBar value={f.pct} color={f.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Products ──────────────────────────────────────────────────────────────────
const Products: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = PRODUCTS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span>+</span> Add Product
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm">🔍</span>
          <input type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
          />
        </div>
        {CATEGORIES.slice(0, 4).map(c => (
          <div key={c.id} className="glass px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs cursor-pointer">
            <span>{c.icon}</span><span className="opacity-60">{c.name}</span>
            <span className="font-semibold" style={{ color: c.color }}>{c.productCount}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Product', 'Brand', 'Category', 'Price', 'Try-Ons', 'Rating', 'Status', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id}
                className="transition-colors"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.imageGradient} flex items-center justify-center text-lg flex-shrink-0`}>
                      {CATEGORIES.find(c => c.id === p.categoryId)?.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <div className="flex gap-1 mt-0.5">
                        {p.colors.slice(0,4).map(c => (
                          <div key={c.id} className="w-3 h-3 rounded-full" style={{ background: c.hex }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs" style={{ color: '#888' }}>{p.brand}</td>
                <td className="py-3 px-4">
                  <Badge color={CATEGORIES.find(c => c.id === p.categoryId)?.color}>{p.categoryName}</Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-bold text-blue-400">{p.currency}{p.price}</span>
                  {p.originalPrice && <span className="text-xs line-through ml-1" style={{ color: '#555' }}>{p.currency}{p.originalPrice}</span>}
                </td>
                <td className="py-3 px-4 text-sm font-semibold">{p.tryOnCount.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm">
                  <span style={{ color: '#f59e0b' }}>★</span>
                  <span className="ml-1 text-xs">{p.rating}</span>
                </td>
                <td className="py-3 px-4">
                  <StatusDot status={p.isAvailable ? 'ACTIVE' : 'INACTIVE'} showLabel />
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button className="glass p-1.5 rounded-lg text-xs hover:scale-105 transition-transform">✏️</button>
                    <button className="glass p-1.5 rounded-lg text-xs hover:scale-105 transition-transform">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Stores ────────────────────────────────────────────────────────────────────
const Stores: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Stores</h1>
      <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">+ Add Store</button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {STORES.map(store => (
        <GlassCard key={store.id} className="p-5" onClick={() => {}}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusDot status={store.status} />
                <span className="text-xs font-medium" style={{ color: store.status === 'ONLINE' ? '#22c55e' : '#ef4444' }}>
                  {store.status}
                </span>
              </div>
              <h3 className="text-base font-bold">{store.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{store.city}, {store.country}</p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{store.address}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: '#555' }}>{store.companyName}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Mirrors', value: store.mirrorCount, icon: '🪞' },
              { label: 'Sessions', value: store.activeSessions, icon: '📱' },
              { label: 'Visitors/d', value: store.dailyVisitors, icon: '👤' },
              { label: 'CVR', value: `${store.conversionRate}%`, icon: '📈' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-base font-bold">{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

// ─── Mirrors ───────────────────────────────────────────────────────────────────
const Mirrors: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Smart Mirrors</h1>
      <div className="flex gap-3 items-center">
        <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">312 Online</span>
        </div>
        <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">+ Register Mirror</button>
      </div>
    </div>
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Mirror', 'Store', 'Status', 'Session', 'CPU', 'Memory', 'Uptime', 'Firmware', ''].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MIRRORS.map((m, i) => (
            <tr key={m.id}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              <td className="py-3 px-4">
                <p className="text-sm font-semibold font-mono">{m.serialNumber}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>{m.locationLabel}</p>
              </td>
              <td className="py-3 px-4 text-xs" style={{ color: '#888' }}>{m.storeName}</td>
              <td className="py-3 px-4"><StatusDot status={m.status} showLabel /></td>
              <td className="py-3 px-4">
                {m.currentSessionId ? (
                  <Badge color="#3b82f6" size="sm">Active</Badge>
                ) : (
                  <span className="text-xs" style={{ color: '#444' }}>—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="w-16">
                  <ProgressBar value={m.cpuUsage} color={m.cpuUsage > 80 ? '#ef4444' : '#22c55e'} showValue />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="w-16">
                  <ProgressBar value={m.memUsage} color={m.memUsage > 80 ? '#ef4444' : '#8b5cf6'} showValue />
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-semibold" style={{ color: m.uptimePercent > 99 ? '#22c55e' : '#f59e0b' }}>
                  {m.uptimePercent}%
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono" style={{ color: '#666' }}>{m.firmwareVersion}</span>
              </td>
              <td className="py-3 px-4">
                <button className="glass p-1.5 rounded-lg text-xs">⚙️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Users ─────────────────────────────────────────────────────────────────────
const Users: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Users</h1>
      <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">+ Invite User</button>
    </div>
    <div className="grid grid-cols-1 gap-3">
      {USERS.map(user => (
        <GlassCard key={user.id} className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${user.avatarColor}22`, color: user.avatarColor, border: `1px solid ${user.avatarColor}44` }}>
              {user.avatarInitials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">{user.name}</p>
                <Badge color={ROLE_COLORS[user.role]} size="sm">
                  {user.role.replace('_', ' ')}
                </Badge>
                <StatusDot status={user.status} showLabel />
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{user.email}</p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{user.companyName}{user.storeName ? ` · ${user.storeName}` : ''}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs" style={{ color: '#555' }}>Last login</p>
              <p className="text-xs font-medium" style={{ color: '#888' }}>{user.lastLoginAt}</p>
            </div>
            <button className="glass p-2 rounded-lg text-sm">⚙️</button>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

// ─── Subscriptions ─────────────────────────────────────────────────────────────
const Subscriptions: React.FC = () => (
  <div className="flex flex-col gap-6">
    <h1 className="text-2xl font-bold">Subscription Plans</h1>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {SUBSCRIPTION_TIERS.map(tier => (
        <div key={tier.id}
          className={`glass rounded-2xl p-6 flex flex-col gap-4 relative ${tier.isPopular ? 'glow-blue' : ''}`}
          style={{ border: tier.isPopular ? `1px solid ${tier.color}55` : '1px solid rgba(255,255,255,0.08)' }}>
          {tier.isPopular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: tier.color }}>POPULAR</span>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tier.color }}>{tier.name}</p>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-4xl font-bold">{tier.currency}{tier.price}</span>
              <span className="text-sm mb-1" style={{ color: '#666' }}>/{tier.period}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#555' }}>
              {tier.mirrorLimit === 999 ? 'Unlimited' : `Up to ${tier.mirrorLimit}`} mirrors
              · {tier.storeLimit === 999 ? 'Unlimited' : tier.storeLimit} stores
            </p>
          </div>
          <div className="flex-1">
            {tier.features.map(f => (
              <div key={f} className="flex items-start gap-2 mb-2">
                <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: tier.color }}>✓</span>
                <span className="text-xs" style={{ color: '#aaa' }}>{f}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tier.isPopular ? tier.color : `${tier.color}18`,
              color: tier.isPopular ? 'white' : tier.color,
              border: `1px solid ${tier.color}44`,
            }}>
            {tier.isPopular ? 'Current Plan' : 'Switch Plan'}
          </button>
        </div>
      ))}
    </div>

    {/* Companies table */}
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4">Active Subscriptions</h3>
      <div className="flex flex-col gap-3">
        {COMPANIES.map(co => (
          <div key={co.id} className="flex items-center gap-4 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${co.logoColor}22`, color: co.logoColor, border: `1px solid ${co.logoColor}33` }}>
              {co.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{co.name}</p>
                <Badge color={co.plan === 'ENTERPRISE' ? '#8b5cf6' : co.plan === 'PROFESSIONAL' ? '#3b82f6' : '#22c55e'} size="sm">
                  {co.plan}
                </Badge>
                <StatusDot status={co.status} showLabel />
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                {co.storeCount} stores · {co.mirrorCount} mirrors · {co.country}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400">${co.monthlyRevenue.toLocaleString()}/mo</p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{co.totalSessions.toLocaleString()} total sessions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Settings ─────────────────────────────────────────────────────────────────
const Settings: React.FC = () => (
  <div className="flex flex-col gap-6">
    <h1 className="text-2xl font-bold">Settings</h1>
    {[
      { section: 'Platform', items: ['Platform Name', 'Support Email', 'Default Currency', 'Default Timezone'] },
      { section: 'AI Engine', items: ['AI Mode (API / Self-Hosted)', 'API Key (FASHN AI)', 'Confidence Threshold', 'Max Resolution'] },
      { section: 'Security', items: ['JWT Expiry', 'MFA Enforcement', 'IP Whitelist', 'Audit Log Retention'] },
      { section: 'Notifications', items: ['Mirror Offline Alerts', 'Low Session Threshold', 'Billing Alerts', 'Weekly Reports'] },
    ].map(group => (
      <div key={group.section} className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#888' }}>{group.section}</h3>
        <div className="flex flex-col gap-3">
          {group.items.map(item => (
            <div key={item} className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-sm">{item}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 rounded-full shimmer" />
                <button className="glass px-3 py-1 rounded-lg text-xs text-blue-400">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main AdminApp ──────────────────────────────────────────────────────────────
export const AdminApp: React.FC = () => {
  const [view, setView] = useState<AdminView>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return <Dashboard />;
      case 'ANALYTICS': return <Analytics />;
      case 'PRODUCTS': return <Products />;
      case 'STORES': return <Stores />;
      case 'MIRRORS': return <Mirrors />;
      case 'USERS': return <Users />;
      case 'SUBSCRIPTIONS': return <Subscriptions />;
      case 'SETTINGS': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#080808' }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}
        style={{ background: '#0e0e0e', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xl flex-shrink-0">🪞</span>
          {sidebarOpen && <span className="text-sm font-bold gradient-text">Sirius Mirror</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${view === item.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              style={{
                background: view === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: view === item.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              }}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
              AC
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">Alex Chen</p>
                <p className="text-xs truncate" style={{ color: '#555' }}>Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button className="glass p-2 rounded-lg text-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <h2 className="text-sm font-semibold">{NAV_ITEMS.find(n => n.id === view)?.label}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass flex items-center gap-2 px-3 py-1.5 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">All Systems Operational</span>
            </div>
            <button className="glass p-2 rounded-lg text-sm relative">
              🔔
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">3</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
