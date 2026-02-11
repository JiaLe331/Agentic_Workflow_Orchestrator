
import Link from 'next/link';

const entities = [
    'company',
    'person',
    'employee',
    'employment_contract',
    'statutory_profile',
    'payroll_run',
    'payslip',
    'ea_form',
    'chart_of_account',
    'general_ledger',
    'customer',
    'invoice',
    'invoice_line',
    'revenue_recognition',
    'tax_filing',
    'audit_log',
];

export default function EntitiesPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">System Entities</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.map((entity) => (
                    <Link
                        key={entity}
                        href={`/entities/${entity}`}
                        className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
                    >
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 capitalize">
                            {entity.replace(/_/g, ' ')}
                        </h5>
                        <p className="font-normal text-gray-700">
                            View records for {entity.replace(/_/g, ' ')}.
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
