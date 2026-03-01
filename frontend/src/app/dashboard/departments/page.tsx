'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers } from 'react-icons/fi';

interface Department {
  id: number;
  name: string;
  description: string;
  head_of_department: number | null;
  head_of_department_name: string | null;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

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
    fetchDepartments();
  }, [_hasHydrated, isAuthenticated, currentClient, router]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get<any>('/employees/departments/');
      const deptData = response.data.results || response.data || [];
      setDepartments(deptData);
    } catch (error: any) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({ name: department.name, description: department.description });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await api.put(`/employees/departments/${editingDepartment.id}/`, formData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/employees/departments/', formData);
        toast.success('Department created successfully');
      }
      handleCloseModal();
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/employees/departments/${id}/`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const totalEmployees = departments.reduce((sum, d) => sum + (d.employee_count || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-accent-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Departments</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {departments.length} departments · {totalEmployees} total employees
            </p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <FiPlus className="w-4 h-4" />
            Add Department
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Departments</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{departments.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{totalEmployees}</p>
          </div>
        </div>

        {/* Departments Grid */}
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((department) => {
              const maxCount = Math.max(...departments.map(d => d.employee_count || 0), 1);
              const barWidth = ((department.employee_count || 0) / maxCount) * 100;

              return (
                <div
                  key={department.id}
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">{department.name}</h3>
                      {department.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{department.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 ml-3">
                      <button
                        onClick={() => handleOpenModal(department)}
                        className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(department.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <FiUsers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{department.employee_count || 0} employees</span>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    {department.head_of_department_name && (
                      <p className="text-xs text-slate-500 mt-2">Head: {department.head_of_department_name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
              <FiUsers className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">No departments yet</h3>
            <p className="text-sm text-slate-500 mb-4">Get started by creating your first department.</p>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              <FiPlus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-elevated max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {editingDepartment ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-field"
                  placeholder="e.g., Engineering, Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Brief description of the department"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
