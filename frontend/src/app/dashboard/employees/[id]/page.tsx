'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentUploadModal from '@/components/DocumentUploadModal';
import DocumentsList from '@/components/DocumentsList';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiUpload, FiMoreVertical } from 'react-icons/fi';
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
    if (!isAuthenticated()) { router.push('/login'); return; }
    if (!currentClient) { router.push('/clients'); return; }
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
      setEmployee({ ...employee, documents: [...(employee.documents || []), document] });
    }
  };

  const handleDocumentDelete = (documentId: number) => {
    if (employee) {
      setEmployee({ ...employee, documents: (employee.documents || []).filter(doc => doc.id !== documentId) });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PROBATION: 'bg-blue-50 text-blue-700 border-blue-200',
      ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
      INACTIVE: 'bg-slate-50 text-slate-600 border-slate-200',
      TERMINATED: 'bg-red-50 text-red-700 border-red-200',
      SUSPENDED: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) return null;

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
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {employee.photo_url ? (
                <img src={employee.photo_url} alt={employee.full_name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-600 font-semibold text-lg">{employee.first_name?.charAt(0) || 'E'}</span>
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{employee.full_name}</h1>
                <p className="text-sm text-slate-500">{employee.position} · ID: #{employee.employee_id}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1.5 ${getStatusBadge(employee.status)}`}>
                  {employee.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/employees/${params.id}/edit`)}
                className="btn-secondary"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-10">
                    <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                      Delete Employee
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {activeTab === 'Personal Information' && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-5">
                  <InfoField label="Full Name" value={employee.full_name} />
                  <InfoField label="Email Address" value={employee.email} />
                  <InfoField label="Phone" value={employee.phone} />
                  <InfoField label="Date of Birth" value={new Date(employee.date_of_birth).toLocaleDateString()} />
                  <div className="col-span-2">
                    <InfoField label="Address" value={`${employee.address}\n${employee.city}, ${employee.state}`} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Job Details' && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Job Details</h2>
                <div className="grid grid-cols-2 gap-5">
                  <InfoField label="Department" value={employee.department_name} />
                  <InfoField label="Manager" value="-" />
                  <InfoField label="Start Date" value={new Date(employee.date_hired).toLocaleDateString()} />
                  <InfoField label="Employment Type" value={employee.employment_type} />
                </div>
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
                  <button onClick={() => setShowUploadModal(true)} className="btn-primary text-sm">
                    <FiUpload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                <DocumentsList documents={employee.documents || []} onDelete={handleDocumentDelete} />
              </div>
            )}

            {activeTab === 'Performance' && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Performance Reviews</h2>
                <div className="text-center py-8 text-sm text-slate-500">No performance reviews yet</div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Job Details</h3>
              <div className="space-y-3">
                <InfoField label="Department" value={employee.department_name} />
                <InfoField label="Manager" value="-" />
                <InfoField label="Start Date" value={new Date(employee.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                <InfoField label="Employment Type" value={employee.employment_type.replace('_', '-')} />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="space-y-3">
                <InfoField label="Name" value={employee.emergency_contact_name || '-'} />
                <InfoField label="Relationship" value={employee.emergency_contact_relationship || '-'} />
                <InfoField label="Phone" value={employee.emergency_contact_phone || '-'} />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/employees/${params.id}/edit`)}
                  className="btn-secondary w-full"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Employee
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-900 whitespace-pre-line">{value}</p>
    </div>
  );
}
