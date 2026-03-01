'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import type { Employee } from '@/types';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiMoreVertical } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function EmployeesPage() {
  const router = useRouter();
  const { currentClient, isAuthenticated, _hasHydrated } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

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
    fetchEmployees();
  }, [_hasHydrated, isAuthenticated, currentClient, router]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get<any>('/employees/');
      let employeesData: Employee[];
      if (response.data.results && Array.isArray(response.data.results)) {
        employeesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      } else {
        employeesData = [];
      }
      setEmployees(employeesData);
    } catch (error: any) {
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/employees/${employeeId}/`);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700',
      INACTIVE: 'bg-slate-100 text-slate-600',
      ON_LEAVE: 'bg-amber-50 text-amber-700',
      TERMINATED: 'bg-red-50 text-red-700',
      PROBATION: 'bg-blue-50 text-blue-700',
      SUSPENDED: 'bg-orange-50 text-orange-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      ACTIVE: 'bg-emerald-500',
      INACTIVE: 'bg-slate-400',
      ON_LEAVE: 'bg-amber-500',
      TERMINATED: 'bg-red-500',
      PROBATION: 'bg-blue-500',
      SUSPENDED: 'bg-orange-500',
    };
    return dots[status] || 'bg-slate-400';
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

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
            <span className="badge badge-neutral">{employees.length}</span>
          </div>
          <button
            onClick={() => router.push('/dashboard/employees/new')}
            className="btn-secondary"
          >
            <FiPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        {/* Table Toolbar */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="PROBATION">Probation</option>
              <option value="TERMINATED">Terminated</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Table */}
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Position</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Salary</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {employee.photo_url ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={employee.photo_url}
                              alt={employee.full_name || 'Employee'}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-slate-600 font-medium text-xs">
                                {employee.first_name?.charAt(0) || 'E'}
                              </span>
                            </div>
                          )}
                          <div>
                            <button
                              onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                              className="text-sm font-medium text-slate-900 hover:text-accent-600 transition-colors text-left"
                            >
                              {employee.full_name}
                            </button>
                            <p className="text-xs text-slate-500">{employee.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{employee.position}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{employee.department_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(employee.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(employee.status)}`} />
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-900 text-right font-medium">
                        ₦{parseFloat(employee.basic_salary).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === employee.id ? null : employee.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                          {openActionMenu === employee.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  router.push(`/dashboard/employees/${employee.id}`);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  router.push(`/dashboard/employees/${employee.id}/edit`);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  handleDelete(employee.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
                <FiSearch className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">No employees found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
