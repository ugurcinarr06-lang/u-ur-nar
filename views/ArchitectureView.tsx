import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ARCH_MODULES, DB_SCHEMA, API_ENDPOINTS, WS_EVENTS } from '../data';
import { Badge } from '../components/shared/GlassCard';

type ArchTab = 'OVERVIEW' | 'DATABASE' | 'API' | 'WEBSOCKET' | 'DEVOPS';

const TABS: { id: ArchTab; icon: string; label: string }[] = [
  { id: 'OVERVIEW', icon: '🏗️', label: 'System Overview' },
  { id: 'DATABASE', icon: '🗄️', label: 'Database Schema' },
  { id: 'API', icon: '🔌', label: 'REST API' },
  { id: 'WEBSOCKET', icon: '⚡', label: 'WebSocket Events' },
  { id: 'DEVOPS', icon: '🚀', label: 'DevOps' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#8b5cf6'
};

const Overview: React.FC = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h2 className="text-lg font-bold mb-1">System Architecture</h2>
      <p className="text-sm" style={{ color: '#666' }}>
        Microservices architecture on Kubernetes with horizontal scaling support for 10,000+ stores.
      </p>
    </div>

    {/* Architecture diagram */}
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#888' }}>Service Map</h3>
      <div className="relative flex flex-col gap-4">
        {/* Clients layer */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Clients</p>
          <div className="grid grid-cols-3 gap-3">
            {['🪞 Mirror Client\n(React/Next.js)', '📱 Mobile PWA\n(React/Next.js)', '⚙️ Admin Panel\n(React/Next.js)'].map((c, i) => (
              <div key={i} className="glass rounded-xl p-3 text-center"
                style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="text-xs font-medium whitespace-pre-line leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Arrow */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-4" style={{ background: 'rgba(59,130,246,0.3)' }} />
            <p className="text-xs" style={{ color: '#444' }}>HTTPS / WSS (Nginx + SSL)</p>
            <div className="w-px h-4" style={{ background: 'rgba(59,130,246,0.3)' }} />
          </div>
        </div>
        {/* Gateway */}
        <div className="glass rounded-xl p-3 text-center"
          style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
          <p className="text-xs font-semibold">🌐 API Gateway / Load Balancer (Nginx)</p>
          <p className="text-xs mt-1" style={{ color: '#666' }}>Rate limiting · JWT validation · Route routing</p>
        </div>
        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-px h-6" style={{ background: 'rgba(59,130,246,0.3)' }} />
        </div>
        {/* Services */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Services</p>
          <div className="grid grid-cols-2 gap-3">
            {['🔌 API Server\n(Node.js + Express)\nREST + WebSocket', '🤖 AI Engine\n(Python + FastAPI)\nVirtual Try-On'].map((s, i) => (
              <div key={i} className="glass rounded-xl p-3 text-center"
                style={{ border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-xs font-medium whitespace-pre-line leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-px h-6" style={{ background: 'rgba(59,130,246,0.3)' }} />
        </div>
        {/* Data layer */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#555' }}>Data Layer</p>
          <div className="grid grid-cols-3 gap-3">
            {['🗄️ PostgreSQL\n+ TimescaleDB', '⚡ Redis\nSessions + PubSub', '📦 AWS S3\n+ CloudFront CDN'].map((d, i) => (
              <div key={i} className="glass rounded-xl p-3 text-center"
                style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
                <p className="text-xs font-medium whitespace-pre-line leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Module cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {ARCH_MODULES.map(mod => (
        <div key={mod.id} className="glass rounded-2xl p-5"
          style={{ border: `1px solid ${mod.color}22` }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${mod.color}18`, border: `1px solid ${mod.color}33` }}>
              {mod.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold">{mod.name}</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#888' }}>{mod.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mod.tech.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}33` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DatabaseSchema: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div>
      <h2 className="text-lg font-bold mb-1">Database Schema</h2>
      <p className="text-sm" style={{ color: '#666' }}>
        PostgreSQL with multi-tenant row-level security. TimescaleDB for analytics time-series.
      </p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {DB_SCHEMA.map(table => (
        <div key={table.name} className="glass rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(6,182,212,0.06)', borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
            <div>
              <p className="text-sm font-bold font-mono text-cyan-400">{table.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{table.description}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
              {table.columns.length} cols
            </span>
          </div>
          <div className="p-3">
            {table.columns.map(col => (
              <div key={col.name} className="flex items-start gap-2 py-1.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xs font-mono font-semibold w-32 flex-shrink-0" style={{ color: '#06b6d4' }}>{col.name}</span>
                <span className="text-xs font-mono" style={{ color: '#8b5cf6', minWidth: 80 }}>{col.type}</span>
                {col.constraint && (
                  <span className="text-xs font-mono truncate" style={{ color: '#555' }}>{col.constraint}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const APIDoc: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div>
      <h2 className="text-lg font-bold mb-1">REST API v1</h2>
      <p className="text-sm" style={{ color: '#666' }}>
        Base URL: <span className="font-mono text-blue-400">https://api.siriusmirror.io</span>
        · JWT Bearer Authentication · JSON responses
      </p>
    </div>
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            {['Method', 'Endpoint', 'Description', 'Auth', 'Roles'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {API_ENDPOINTS.map((ep, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded-md text-xs font-bold font-mono"
                  style={{ background: `${METHOD_COLORS[ep.method]}22`, color: METHOD_COLORS[ep.method] }}>
                  {ep.method}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono" style={{ color: '#aaa' }}>{ep.path}</span>
              </td>
              <td className="py-3 px-4 text-xs" style={{ color: '#888' }}>{ep.description}</td>
              <td className="py-3 px-4">
                <span className="text-xs" style={{ color: ep.auth ? '#22c55e' : '#f59e0b' }}>
                  {ep.auth ? '🔒 JWT' : '🔓 Public'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {ep.roles?.map(r => (
                    <span key={r} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#666' }}>
                      {r.replace('_', ' ')}
                    </span>
                  )) ?? <span className="text-xs" style={{ color: '#444' }}>Any</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const WebSocketDoc: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div>
      <h2 className="text-lg font-bold mb-1">WebSocket Events</h2>
      <p className="text-sm" style={{ color: '#666' }}>
        Socket.IO · Namespace: <span className="font-mono text-blue-400">/session</span>
        · Target latency: <span className="font-semibold text-green-400">&lt;200ms</span>
      </p>
    </div>

    {/* Connection flow */}
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4">Connection Flow</h3>
      <div className="flex flex-col gap-2">
        {[
          { step: '1', label: 'Mirror boots', detail: 'Connects to /session namespace, sends MIRROR_READY with mirrorId' },
          { step: '2', label: 'QR Scanned', detail: 'Mobile opens session URL, server emits SESSION_CONNECTED to mirror room' },
          { step: '3', label: 'Product Selected', detail: 'Mobile emits PRODUCT_SELECTED → server relays → mirror renders overlay' },
          { step: '4', label: 'Try-On Processing', detail: 'Mirror emits TRYON_STARTED → AI engine processes → TRYON_COMPLETED with overlay data' },
          { step: '5', label: 'Session End', detail: 'Either party emits SESSION_ENDED → room is destroyed, analytics stored' },
        ].map(f => (
          <div key={f.step} className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', marginTop: 2 }}>
              {f.step}
            </div>
            <div>
              <span className="text-sm font-semibold">{f.label}</span>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{f.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Events table */}
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            {['Event', 'Direction', 'Description', 'Payload'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WS_EVENTS.map((ev, i) => (
            <tr key={ev.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              <td className="py-3 px-4">
                <span className="text-xs font-mono font-semibold text-yellow-400">{ev.name}</span>
              </td>
              <td className="py-3 px-4">
                <Badge
                  color={ev.direction === 'EMIT' ? '#3b82f6' : ev.direction === 'LISTEN' ? '#22c55e' : '#8b5cf6'}
                  size="sm">{ev.direction}</Badge>
              </td>
              <td className="py-3 px-4 text-xs" style={{ color: '#888' }}>{ev.description}</td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono" style={{ color: '#666' }}>{ev.payload}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DevOps: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div>
      <h2 className="text-lg font-bold mb-1">DevOps & Infrastructure</h2>
      <p className="text-sm" style={{ color: '#666' }}>
        Containerized microservices on Kubernetes with blue-green deployments and auto-scaling.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Docker compose */}
      <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
        <h3 className="text-sm font-semibold mb-3">🐋 docker-compose.yml (excerpt)</h3>
        <pre className="text-xs font-mono overflow-x-auto no-scrollbar" style={{ color: '#aaa', lineHeight: 1.6 }}>
{`services:
  api:
    image: siriusmirror/api:latest
    ports: ["3001:3001"]
    env_file: .env
    depends_on: [postgres, redis]
    deploy:
      replicas: 3
      resources:
        limits: {cpus: "1", memory: 1G}

  ai-engine:
    image: siriusmirror/ai:latest
    ports: ["8000:8000"]
    deploy:
      replicas: 2
      resources:
        limits: {cpus: "4", memory: 8G}
    volumes:
      - model-cache:/app/models

  postgres:
    image: timescale/timescaledb:latest-pg15
    volumes: [pgdata:/var/lib/postgresql]
    environment:
      POSTGRES_DB: siriusmirror

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb`}
        </pre>
      </div>

      {/* GitHub Actions */}
      <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(139,92,246,0.15)' }}>
        <h3 className="text-sm font-semibold mb-3">⚡ CI/CD Pipeline</h3>
        <div className="flex flex-col gap-3">
          {[
            { stage: 'Test', icon: '🧪', steps: ['Unit tests (Jest)', 'Integration tests', 'Type check (tsc)', 'Lint (ESLint)'], color: '#3b82f6' },
            { stage: 'Build', icon: '🔨', steps: ['Docker image build', 'Push to ECR', 'Scan (Trivy)', 'Sign image'], color: '#8b5cf6' },
            { stage: 'Deploy', icon: '🚀', steps: ['k8s rolling update', 'Health checks', 'Smoke tests', 'Notify team'], color: '#22c55e' },
          ].map(p => (
            <div key={p.stage} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${p.color}18`, border: `1px solid ${p.color}33` }}>
                {p.icon}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: p.color }}>{p.stage}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.steps.map(s => (
                    <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scaling */}
      <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
        <h3 className="text-sm font-semibold mb-3">📈 Scaling Strategy</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: '1–10 stores', detail: 'Single Docker Compose, 1 API replica, managed DB', badge: 'Starter' },
            { label: '10–100 stores', detail: 'Kubernetes cluster, 3–5 API replicas, RDS Multi-AZ', badge: 'Professional' },
            { label: '100–10K stores', detail: 'Multi-region K8s, HPA + KEDA, Aurora Global DB', badge: 'Enterprise' },
          ].map(s => (
            <div key={s.label} className="flex items-start gap-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', flexShrink: 0 }}>
                {s.badge}
              </span>
              <div>
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666' }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring */}
      <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
        <h3 className="text-sm font-semibold mb-3">📊 Observability Stack</h3>
        <div className="flex flex-col gap-2">
          {[
            { tool: 'Prometheus + Grafana', use: 'Metrics: CPU, memory, latency, throughput' },
            { tool: 'ELK Stack', use: 'Centralized logging, audit trails, error tracking' },
            { tool: 'Jaeger', use: 'Distributed tracing across microservices' },
            { tool: 'PagerDuty', use: 'On-call alerts for mirror offline, API down' },
            { tool: 'Datadog APM', use: 'Application performance monitoring, anomaly detection' },
          ].map(m => (
            <div key={m.tool} className="flex items-start gap-2">
              <span className="text-xs" style={{ color: '#ef4444' }}>→</span>
              <div>
                <span className="text-xs font-semibold">{m.tool}</span>
                <span className="text-xs ml-2" style={{ color: '#666' }}>{m.use}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ArchTab>('OVERVIEW');

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0e0e0e' }}>
        <h1 className="text-lg font-bold gradient-text">System Architecture</h1>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>Sirius Mirror Platform — Production-grade SaaS</p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-6 py-3 overflow-x-auto no-scrollbar"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#666',
              border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            {activeTab === 'OVERVIEW' && <Overview />}
            {activeTab === 'DATABASE' && <DatabaseSchema />}
            {activeTab === 'API' && <APIDoc />}
            {activeTab === 'WEBSOCKET' && <WebSocketDoc />}
            {activeTab === 'DEVOPS' && <DevOps />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
