'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import type { Client } from '@/types';
import { FiPlus, FiUsers, FiLogOut, FiX, FiSearch, FiBarChart, FiSettings, FiHelpCircle, FiGrid, FiBriefcase } from 'react-icons/fi';

export default function ClientsPage() {

  const router = useRouter();
  const { user, logout, setCurrentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Onboarding' | 'Inactive'>('All');

  useEffect(() => {
    console.log('[ClientsPage] useEffect triggered', { _hasHydrated, isAuth: isAuthenticated() });

    // Wait for hydration before checking auth
    if (!_hasHydrated) {
      return;
    }

    if (!isAuthenticated()) {
      return;
    }

    console.log('[ClientsPage] Fetching clients...');
    fetchClients();
  }, [_hasHydrated, isAuthenticated, router]);

  const fetchClients = async () => {
    try {
      const response = await api.get<any>('/clients/');
      console.log('[ClientsPage] API response:', response.data);

      // Handle both paginated and non-paginated responses
      let clientsData: Client[];
      if (response.data.results && Array.isArray(response.data.results)) {
        // Paginated response from Django REST Framework
        clientsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        clientsData = response.data;
      } else {
        // Fallback to empty array
        clientsData = [];
      }

      console.log('[ClientsPage] Setting clients:', clientsData);
      setClients(clientsData);
    } catch (error: any) {
      console.error('[ClientsPage] Error fetching clients:', error);
      toast.error('Failed to load clients');
      setClients([]); // Set empty array on error
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
      fetchClients(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to add client:', error);
      toast.error(error.response?.data?.message || 'Failed to add client');
    }
  };

  // Helper function to get client status
  const getClientStatus = (client: Client): 'Active' | 'Onboarding' | 'Inactive' => {
    if (!client.is_active) return 'Inactive';
    // If client has less than 5 employees, consider it as onboarding
    if (client.total_employees < 5) return 'Onboarding';
    return 'Active';
  };

  // Filter clients based on search and tab
  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    const clientStatus = getClientStatus(client);
    const matchesTab = activeTab === 'All' || clientStatus === activeTab;

    return matchesSearch && matchesTab;
  });

  // Get pending tasks count (mock data for now, can be replaced with real API data)
  const getPendingTasks = (client: Client): number => {
    // This can be replaced with real data from API
    return Math.floor(Math.random() * 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col fixed h-full">
        {/* Logo & Branding */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-teal-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">CADENZA</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Cadenza</h1>
              <h2 className="text-base font-bold text-gray-900">Consulting</h2>
            </div>
          </div>
          <p className="text-xs text-gray-500">HR Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 w-full"
          >
            <FiGrid className="text-lg" />
            Dashboard
          </button>
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg w-full mt-1"
          >
            <FiBriefcase className="text-lg" />
            Clients
          </button>
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 w-full mt-1"
          >
            <FiBarChart className="text-lg" />
            Reports
          </button>
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 w-full mt-1"
          >
            <FiSettings className="text-lg" />
            Settings
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t">
          <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 w-full">
            <FiHelpCircle className="text-lg" />
            Support
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 w-full mt-2"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 ml-6">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.first_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.first_name} P.</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <FiPlus />
              Add New Client
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(['All', 'Active', 'Onboarding', 'Inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Clients Grid */}
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClients.map((client) => {
                const status = getClientStatus(client);
                const pendingTasks = getPendingTasks(client);

                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
                  >
                    {/* Company Logo/Icon */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="h-12 w-12 object-contain rounded-lg bg-gray-50 p-2"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-teal-700">
                              {client.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : status === 'Onboarding'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          ● {status}
                        </span>
                      </div>

                      {/* Company Name */}
                      <h3 className="text-base font-bold text-gray-900 mb-1">{client.name}</h3>

                      {/* Employee Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active Employees</span>
                          <span className="font-semibold text-gray-900">{client.active_employees}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pending Tasks</span>
                          <span className="font-semibold text-gray-900">{pendingTasks}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiUsers className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first client to manage their HR operations.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <FiPlus />
                Add Your First Client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">Add New Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Information */}
                <div className="md:col-span-2">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Company Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    name="industry"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RC Number
                  </label>
                  <input
                    type="text"
                    name="rc_number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Person */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Contact Person</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="contact_person_email"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="contact_person_phone"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
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
