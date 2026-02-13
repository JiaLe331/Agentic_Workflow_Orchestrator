"use client";

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { EmployeeSlideOver } from '@/components/EmployeeSlideOver';
import { Employee, PayRoll, fetchEmployees, fetchEmployeeById } from '@/lib/supabase';
import { Users, UserCheck, UserX } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Employee Management</h1>
                    <p className="text-slate-400">Manage employee profiles and payroll information</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-3xl p-6 border border-emerald-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-600/20 rounded-xl">
                                <Users className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Employees</p>
                                <p className="text-3xl font-bold text-white">{totalEmployees}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-6 border border-blue-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600/20 rounded-xl">
                                <UserCheck className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Active</p>
                                <p className="text-3xl font-bold text-white">{activeEmployees}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-3xl p-6 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-600/20 rounded-xl">
                                <UserX className="text-slate-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Inactive</p>
                                <p className="text-3xl font-bold text-white">{totalEmployees - activeEmployees}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Table */}
                <BentoCard title="All Employees" subtitle="Click on an employee to view details" fullWidth>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">Loading employee data...</td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">No employee data available</td>
                                    </tr>
                                ) : (
                                    employees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            onClick={() => handleEmployeeClick(employee)}
                                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{employee.name}</p>
                                                        <p className="text-xs text-slate-500">{employee.title || 'Employee'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-300">
                                                {employee.email || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-300">
                                                {employee.phone || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-white font-medium">
                                                {employee.payroll?.role || employee.title || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.payroll
                                                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                                                    : 'bg-slate-700/30 text-slate-400 border border-slate-600/50'
                                                    }`}>
                                                    {employee.payroll ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-white text-right font-semibold">
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
