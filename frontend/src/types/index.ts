// Type definitions for the Cadenza HR system

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: 'ADMIN' | 'STAFF';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  logo: string | null;
  logo_url: string | null;
  email: string;
  phone: string;
  address: string;
  industry: string;
  contact_person: string;
  contact_person_email: string;
  contact_person_phone: string;
  is_active: boolean;
  rc_number: string;
  tax_id: string;
  total_employees: number;
  active_employees: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  head_of_department: number | null;
  head_of_department_name: string | null;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  photo: string | null;
  photo_url: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  department: number;
  department_name: string;
  position: string;
  date_hired: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'PROBATION' | 'SUSPENDED';
  basic_salary: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  routing_code: string;
  account_type: 'SAVINGS' | 'CURRENT';
  tax_id: string;
  pension_number: string;
  resume: string | null;
  contract: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  years_of_service: number;
  is_active: boolean;
  allowances?: Allowance[];
  deductions?: Deduction[];
  documents?: EmployeeDocument[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: number;
  employee: number;
  name: string;
  description: string;
  file: string;
  file_url: string;
  file_size: number;
  file_size_display: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface Allowance {
  id: number;
  employee: number;
  name: string;
  amount: string;
  is_taxable: boolean;
  is_recurring: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Deduction {
  id: number;
  employee: number;
  name: string;
  amount: string;
  is_recurring: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettings {
  id: number;
  enable_pension: boolean;
  pension_rate: string;
  enable_nhf: boolean;
  nhf_rate: string;
  enable_tax: boolean;
  tax_free_allowance: string;
  created_at: string;
  updated_at: string;
}

export interface StatutoryEarning {
  id: number;
  name: string;
  description: string;
  is_percentage: boolean;
  amount: string;
  is_taxable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatutoryDeduction {
  id: number;
  name: string;
  description: string;
  is_percentage: boolean;
  amount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriod {
  id: number;
  title: string;
  period_type: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY';
  start_date: string;
  end_date: string;
  payment_date: string;
  status: 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'REVERSED';
  notes: string;
  total_gross_pay: string;
  total_net_pay: string;
  total_deductions: string;
  total_tax: string;
  payroll_count: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollBatch {
  id: number;
  batch_number: string;
  title: string;
  period: number;
  period_name?: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  description: string;
  total_gross_pay: string;
  total_net_pay: string;
  total_deductions: string;
  payroll_count: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollEarning {
  id: number;
  payroll: number;
  name: string;
  amount: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollDeduction {
  id: number;
  payroll: number;
  name: string;
  amount: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: number;
  employee: number;
  employee_name: string;
  employee_id_number: string;
  period: number;
  period_name?: string;
  period_details?: PayrollPeriod;
  batch?: number | null;
  batch_number?: string;
  batch_details?: PayrollBatch;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  basic_salary: string;
  total_allowances: string;
  total_statutory_earnings: string;
  total_additional_earnings: string;
  gross_pay: string;
  pension: string;
  nhf: string;
  tax: string;
  total_statutory_deductions: string;
  other_deductions: string;
  total_additional_deductions: string;
  total_deductions: string;
  net_pay: string;
  payment_date: string | null;
  payment_reference: string;
  notes: string;
  earnings?: PayrollEarning[];
  deductions?: PayrollDeduction[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  on_leave: number;
  probation: number;
  suspended: number;
  terminated: number;
  by_department: { department__name: string; count: number }[];
  by_employment_type: { employment_type: string; count: number }[];
}

export interface PayrollStats {
  total_gross: string;
  total_net: string;
  total_tax: string;
  total_pension: string;
  total_nhf: string;
  total_deductions: string;
  count: number;
  by_status: { status: string; count: number; total: string }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
