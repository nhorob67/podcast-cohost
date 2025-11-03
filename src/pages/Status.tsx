import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  endpoint: string;
  responseTime?: number;
}

export default function Status() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Conversations API', status: 'checking', endpoint: '/functions/v1/conversations' },
    { name: 'Reports API', status: 'checking', endpoint: '/functions/v1/reports' },
    { name: 'Personality API', status: 'checking', endpoint: '/functions/v1/personality' },
    { name: 'Settings API', status: 'checking', endpoint: '/functions/v1/settings' },
    { name: 'Health Check', status: 'checking', endpoint: '/functions/v1/health' },
  ]);

  const checkServices = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const updatedServices = await Promise.all(
      services.map(async (service) => {
        const start = Date.now();
        try {
          const response = await fetch(`${supabaseUrl}${service.endpoint}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${anonKey}`,
            },
          });
          const responseTime = Date.now() - start;

          return {
            ...service,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime,
          } as ServiceStatus;
        } catch (error) {
          return {
            ...service,
            status: 'unhealthy',
            responseTime: Date.now() - start,
          } as ServiceStatus;
        }
      })
    );

    setServices(updatedServices);
  };

  useEffect(() => {
    checkServices();
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'unhealthy':
        return 'bg-red-50 border-red-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const allHealthy = services.every((s) => s.status === 'healthy');
  const anyUnhealthy = services.some((s) => s.status === 'unhealthy');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">System Status</h1>
          <p className="text-slate-600 mb-8">Real-time health check of all services</p>

          {allHealthy && !anyUnhealthy && services[0].status !== 'checking' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">All Systems Operational</p>
                <p className="text-sm text-green-700 mt-1">
                  All services are running smoothly
                </p>
              </div>
            </div>
          )}

          {anyUnhealthy && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Service Degradation</p>
                <p className="text-sm text-red-700 mt-1">
                  Some services are experiencing issues
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                className={`border rounded-lg p-4 transition-colors ${getStatusColor(
                  service.status
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium text-slate-900">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.endpoint}</p>
                    </div>
                  </div>
                  {service.responseTime !== undefined && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {service.responseTime}ms
                      </p>
                      <p className="text-xs text-slate-500">Response time</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={checkServices}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>

          <div className="mt-8 bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Environment Info</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-medium">Supabase URL:</span>{' '}
                {import.meta.env.VITE_SUPABASE_URL}
              </p>
              <p>
                <span className="font-medium">Deploy Mode:</span> Production
              </p>
              <p>
                <span className="font-medium">Last Check:</span> {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
