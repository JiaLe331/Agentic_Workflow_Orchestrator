import { IconX, IconUser, IconMail, IconPhone, IconCalendar, IconMapPin, IconBriefcase } from '@tabler/icons-react';
import { Employee, PayRoll } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface EmployeeSlideOverProps {
    employee: (Employee & { payroll?: PayRoll }) | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EmployeeSlideOver({ employee, isOpen, onClose }: EmployeeSlideOverProps) {
    if (!isOpen || !employee) return null;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                                {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                                <p className="text-sm text-gray-500">{employee.payroll?.role || employee.title || 'Employee'}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <IconX size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Employee Details */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                            Employee Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <IconMail className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm text-gray-900">{employee.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IconPhone className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm text-gray-900">{employee.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IconCalendar className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">Date of Birth</p>
                                    <p className="text-sm text-gray-900">{new Date(employee.date_of_birth).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IconUser className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">Gender</p>
                                    <p className="text-sm text-gray-900 capitalize">{employee.gender}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IconMapPin className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">Nationality</p>
                                    <p className="text-sm text-gray-900">{employee.nationality || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IconBriefcase className="text-emerald-600 mt-1" size={18} />
                                <div>
                                    <p className="text-xs text-gray-500">IC Number</p>
                                    <p className="text-sm text-gray-900">{employee.ic}</p>
                                </div>
                            </div>
                        </div>
                        {employee.address && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Address</p>
                                <p className="text-sm text-gray-900">{employee.address}</p>
                            </div>
                        )}
                    </div>

                    {/* Payslip */}
                    {employee.payroll && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <IconBriefcase size={16} />
                                Payslip - {new Date(0, employee.payroll.month - 1).toLocaleString('default', { month: 'long' })} {employee.payroll.year}
                            </h3>

                            <div className="space-y-4">
                                {/* Basic Salary */}
                                <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
                                    <span className="text-sm text-gray-600">Basic Salary</span>
                                    <span className="text-lg font-semibold text-gray-900">RM {employee.payroll.salary.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                </div>

                                {/* Deductions */}
                                <div className="space-y-2">
                                    <p className="text-xs text-emerald-600 font-semibold uppercase">Deductions</p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">EPF Employee ({employee.payroll.epf_percentage_employee}%)</span>
                                        <span className="text-sm text-red-500">- RM {employee.payroll.epf_individual_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Tax Amount</span>
                                        <span className="text-sm text-red-500">- RM {employee.payroll.tax_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {/* Company Contribution */}
                                <div className="space-y-2 pt-3 border-t border-emerald-200">
                                    <p className="text-xs text-emerald-600 font-semibold uppercase">Company Contribution</p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">EPF Company ({employee.payroll.epf_percentage_company}%)</span>
                                        <span className="text-sm text-emerald-600">+ RM {employee.payroll.epf_company_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="space-y-2 pt-4 border-t border-emerald-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Gross Salary</span>
                                        <span className="text-base font-semibold text-gray-900">RM {employee.payroll.gross_salary.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-emerald-300">
                                        <span className="text-base font-bold text-emerald-600">Net Salary</span>
                                        <span className="text-2xl font-bold text-emerald-600">RM {employee.payroll.total_salary.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
