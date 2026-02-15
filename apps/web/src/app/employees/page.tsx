"use client";

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { EmployeeSlideOver } from '@/components/EmployeeSlideOver';
import { Employee, PayRoll, fetchEmployees, fetchEmployeeById } from '@/lib/supabase';
import { Users, UserCheck, UserX, Banknote } from 'lucide-react';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<(Employee & { payroll?: PayRoll })[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<(Employee & { payroll?: PayRoll }) | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingEmployee, setLoadingEmployee] = useState(false);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        const data = await fetchEmployees();
        setEmployees(data);
        setLoading(false);
    };

    const handleEmployeeClick = async (employee: Employee & { payroll?: PayRoll }) => {
        setLoadingEmployee(true);
        setIsSlideOverOpen(true);

        // Fetch detailed employee data with payroll
        const detailedEmployee = await fetchEmployeeById(employee.id);

        if (detailedEmployee) {
            setSelectedEmployee(detailedEmployee);
        } else {
            setSelectedEmployee(employee); // Fallback to cached data
        }

        setLoadingEmployee(false);
    };

    const handleCloseSlideOver = () => {
        setIsSlideOverOpen(false);
        setTimeout(() => setSelectedEmployee(null), 300);
    };

    // Calculate stats
    const activeEmployees = employees.filter(emp => emp.payroll).length;
    const totalEmployees = employees.length;
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.payroll?.total_salary || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-normal text-gray-900 mb-2">Employee Management</h1>
                        <p className="text-gray-500">Manage employee profiles and payroll information</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm flex items-center gap-4 min-w-[240px]">
                        <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-900">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Salary Issued</p>
                            <p className="text-xl font-bold text-zinc-900 tracking-tight">
                                RM {totalSalary.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-900">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total Employees</p>
                                <p className="text-2xl font-bold text-zinc-900 tracking-tight">{totalEmployees}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-900">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Active</p>
                                <p className="text-2xl font-bold text-zinc-900 tracking-tight">{activeEmployees}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-900">
                                <UserX size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Inactive</p>
                                <p className="text-2xl font-bold text-zinc-900 tracking-tight">{totalEmployees - activeEmployees}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Table */}
                <BentoCard title="All Employees" subtitle="Click on an employee to view details" fullWidth>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Loading employee data...</td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">No employee data available</td>
                                    </tr>
                                ) : (
                                    employees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            onClick={() => handleEmployeeClick(employee)}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                                        <p className="text-xs text-gray-500">{employee.title || 'Employee'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600">
                                                {employee.email || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600">
                                                {employee.phone || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                                                {employee.payroll?.role || employee.title || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.payroll
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                    {employee.payroll ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900 text-right font-semibold">
                                                {employee.payroll
                                                    ? `RM ${employee.payroll.total_salary.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>
            </div>

            {/* Employee Details Slide-over */}
            <EmployeeSlideOver
                employee={selectedEmployee}
                isOpen={isSlideOverOpen}
                onClose={handleCloseSlideOver}
            />
        </div>
    );
}
