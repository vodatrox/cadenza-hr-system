'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import type { Client } from '@/types';
import { FiPlus, FiUsers, FiLogOut, FiX, FiSearch, FiBell } from 'react-icons/fi';

export default function ClientsPage() {
  const router = useRouter();
  const { user, logout, setCurrentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Onboarding' | 'Inactive'>('All');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated()) return;
    fetchClients();
  }, [_hasHydrated, isAuthenticated, router]);

  const fetchClients = async () => {
    try {
      const response = await api.get<any>('/clients/');
      let clientsData: Client[];
      if (response.data.results && Array.isArray(response.data.results)) {
        clientsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        clientsData = response.data;
      } else {
        clientsData = [];
      }
      setClients(clientsData);
    } catch (error: any) {
      toast.error('Failed to load clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setCurrentClient(client);
    toast.success(`Selected ${client.name}`);
    router.push(`/dashboard`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      industry: formData.get('industry'),
      contact_person: formData.get('contact_person'),
      contact_person_email: formData.get('contact_person_email'),
      contact_person_phone: formData.get('contact_person_phone'),
      rc_number: formData.get('rc_number'),
      tax_id: formData.get('tax_id'),
    };

    try {
      await api.post('/clients/', clientData);
      toast.success('Client added successfully');
      setShowAddModal(false);
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add client');
    }
  };

  const getClientStatus = (client: Client): 'Active' | 'Onboarding' | 'Inactive' => {
    if (!client.is_active) return 'Inactive';
    if (client.total_employees < 5) return 'Onboarding';
    return 'Active';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const clientStatus = getClientStatus(client);
    const matchesTab = activeTab === 'All' || clientStatus === activeTab;
    return matchesSearch && matchesTab;
  });

  const statusDot = (status: string) => {
    if (status === 'Active') return 'bg-emerald-500';
    if (status === 'Onboarding') return 'bg-amber-500';
    return 'bg-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Cadenza<span className="text-accent-600">HR</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <FiBell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 font-medium text-sm">
                    {user?.first_name?.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Sign out"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Select a Client</h2>
            <p className="text-sm text-slate-500 mt-0.5">{clients.length} clients available</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <FiPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(['All', 'Active', 'Onboarding', 'Inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => {
              const status = getClientStatus(client);
              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 hover:shadow-card transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={client.name}
                        className="h-10 w-10 object-contain rounded-lg bg-slate-50 p-1.5"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-600">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusDot(status)}`} />
                      <span className="text-xs font-medium text-slate-500">{status}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{client.name}</h3>
                  {client.industry && (
                    <span className="badge badge-neutral text-[11px] mb-3">{client.industry}</span>
                  )}

                  <div className="pt-3 border-t border-slate-100 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Employees</span>
                      <span className="font-medium text-slate-900">{client.active_employees}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
              <FiUsers className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No clients found</h3>
            <p className="text-sm text-slate-500 mb-4">
              Get started by adding your first client.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Add New Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
                      <input type="text" name="name" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry *</label>
                      <input type="text" name="industry" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                      <input type="email" name="email" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
                      <input type="tel" name="phone" required className="input-field" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Address *</label>
                      <textarea name="address" required rows={2} className="input-field resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">RC Number</label>
                      <input type="text" name="rc_number" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax ID</label>
                      <input type="text" name="tax_id" className="input-field" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Contact Person</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                      <input type="text" name="contact_person" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                      <input type="email" name="contact_person_email" required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
                      <input type="tel" name="contact_person_phone" required className="input-field" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
