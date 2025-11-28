'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentUploadModal from '@/components/DocumentUploadModal';
import DocumentsList from '@/components/DocumentsList';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiDownload, FiUpload, FiMoreVertical } from 'react-icons/fi';
import type { Employee, EmployeeDocument } from '@/types';

type Tab = 'Personal Information' | 'Job Details' | 'Compensation' | 'Benefits' | 'Performance' | 'Documents';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Personal Information');
  const [showActions, setShowActions] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!currentClient) {
      router.push('/clients');
      return;
    }
    fetchEmployee();
  }, [_hasHydrated, isAuthenticated, currentClient, params.id]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get<Employee>(`/employees/${params.id}/`);
      setEmployee(response.data);
    } catch (error: any) {
      toast.error('Failed to load employee details');
      router.push('/dashboard/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

    try {
      await api.delete(`/employees/${params.id}/`);
      toast.success('Employee deleted successfully');
      router.push('/dashboard/employees');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleDocumentUploadSuccess = (document: EmployeeDocument) => {
    if (employee) {
      setEmployee({
        ...employee,
        documents: [...(employee.documents || []), document],
      });
    }
  };

  const handleDocumentDelete = (documentId: number) => {
    if (employee) {
      setEmployee({
        ...employee,
        documents: (employee.documents || []).filter(doc => doc.id !== documentId),
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PROBATION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ON_LEAVE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'INACTIVE':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return null;
  }

  const tabs: Tab[] = ['Personal Information', 'Job Details', 'Compensation', 'Benefits', 'Performance', 'Documents'];

  return (
    <DashboardLayout>
      {showUploadModal && (
        <DocumentUploadModal
          employeeId={employee.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleDocumentUploadSuccess}
        />
      )}
      <div className="space-y-6">
        {/* Employee Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {employee.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt={employee.full_name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-100">
                  <span className="text-white font-semibold text-xl">
                    {employee.first_name?.charAt(0) || 'E'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{employee.full_name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {employee.position} • ID: #{employee.employee_id}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2 ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/employees/${params.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FiEdit2 className="text-base" />
                Edit
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiMoreVertical className="text-base" />
                  Actions
                </button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete Employee
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            {activeTab === 'Personal Information' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Full Name</p>
                    <p className="text-sm text-gray-900">{employee.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="text-sm text-gray-900">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{employee.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Date of Birth</p>
                    <p className="text-sm text-gray-900">{new Date(employee.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                    <p className="text-sm text-gray-900">{employee.address}</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {employee.city}, {employee.state}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Details */}
            {activeTab === 'Job Details' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Department</p>
                    <p className="text-sm text-gray-900">{employee.department_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Manager</p>
                    <p className="text-sm text-gray-900">-</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm text-gray-900">{new Date(employee.date_hired).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Employment Type</p>
                    <p className="text-sm text-gray-900">{employee.employment_type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {activeTab === 'Documents' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <FiUpload className="text-base" />
                    Upload Document
                  </button>
                </div>
                <DocumentsList
                  documents={employee.documents || []}
                  onDelete={handleDocumentDelete}
                />
              </div>
            )}

            {/* Performance */}
            {activeTab === 'Performance' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Reviews</h2>
                <div className="text-center py-12 text-gray-500 text-sm">
                  No performance reviews yet
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Job Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Department</p>
                  <p className="text-sm text-gray-900">{employee.department_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Manager</p>
                  <p className="text-sm text-gray-900">-</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Start Date</p>
                  <p className="text-sm text-gray-900">{new Date(employee.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Employment Type</p>
                  <p className="text-sm text-gray-900">{employee.employment_type.replace('_', '-')}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-sm text-gray-900">{employee.emergency_contact_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Relationship</p>
                  <p className="text-sm text-gray-900">{employee.emergency_contact_relationship || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-900">{employee.emergency_contact_phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <FiEdit2 className="text-base" />
                  Initiate Onboarding
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <FiTrash2 className="text-base" />
                  Delete Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
