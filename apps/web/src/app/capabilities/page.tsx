"use client";

import { ArrowLeft, Calendar, FileText, Mail, MessageSquare, Video, Zap, Database, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CapabilitiesPage() {
    const router = useRouter();

    const actions = [
        { icon: Video, label: "Google Meet", description: "Schedule meetings & generate links" },
        { icon: Calendar, label: "Google Calendar", description: "Manage events & invites" },
        { icon: FileText, label: "PDF Parser", description: "Extract text & data from PDFs" },
        { icon: Mail, label: "Gmail", description: "Send & label emails" },
        { icon: MessageSquare, label: "Slack", description: "Send notifications to channels" },
        { icon: Database, label: "HubSpot", description: "Sync contacts & deals" },
    ];

    const scenarios = [
        {
            title: "Employee Onboarding",
            description: "Automate the setup for new hires across all systems.",
            before: "HR spends 4 hours manually creating accounts, drafting emails, and scheduling training sessions.",
            after: "Workflow executes in 2 minutes. Accounts created, welcome email sent, training scheduled automatically.",
            entities: ["HR.Employees", "HR.Statutory_Rates", "IT.Accounts"],
            color: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
        },
        {
            title: "Sales Commission Payout",
            description: "Calculate and process monthly commissions based on closed deals.",
            before: "Finance manually exports Excel sheets, matches deals to employees, and calculates payouts. Prone to errors.",
            after: "System reads 'Sales.Commissions', links to 'HR.Payslips', and generates 'Finance.Journal_Entries' instantly.",
            entities: ["Sales.Commissions", "HR.Payslips", "Finance.GL"],
            color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
        },
        {
            title: "Daily Activity Summary",
            description: "Generate a digest of what each employee accomplished.",
            before: "Managers chase updates or manually check CRM and Jira.",
            after: "AI aggregates data from 'Sales.Deals' (closed today) and creates a summary report.",
            entities: ["Sales.Deals", "Sales.Activities", "HR.Employees"],
            color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Collections
                    </button>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">System Capabilities</h1>
                    <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
                        Discover how our AI automates complex workflows by connecting distinct business entities.
                    </p>
                </div>

                {/* Integration Library */}
                <section className="mb-16">
                    <h2 className="mb-6 flex items-center text-lg font-semibold text-zinc-900 dark:text-white">
                        <Zap className="mr-2 h-5 w-5 text-amber-500" />
                        Action Library
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {actions.map((action, idx) => (
                            <div key={idx} className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                                <action.icon className="mb-3 h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                                <h3 className="font-medium text-zinc-900 dark:text-white">{action.label}</h3>
                                <p className="mt-1 text-xs text-zinc-500">{action.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Scenarios */}
                <section className="mb-16">
                    <h2 className="mb-6 flex items-center text-lg font-semibold text-zinc-900 dark:text-white">
                        <FileText className="mr-2 h-5 w-5 text-emerald-500" />
                        Real-World Scenarios
                    </h2>
                    <div className="space-y-6">
                        {scenarios.map((scenario, idx) => (
                            <div key={idx} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <div className={`px-6 py-4 ${scenario.color}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold">{scenario.title}</h3>
                                            <p className="opacity-90">{scenario.description}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 opacity-50" />
                                    </div>
                                </div>
                                <div className="grid gap-6 p-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-500">The Problem (Manual)</div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{scenario.before}</p>
                                        </div>
                                        <div>
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">The Solution (AI)</div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{scenario.after}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
                                        <div className="mb-2 text-xs font-medium text-zinc-500">Touched Entities</div>
                                        <div className="flex flex-wrap gap-2">
                                            {scenario.entities.map((entity, i) => (
                                                <Link href="/entity-map" key={i} className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-mono text-zinc-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-emerald-400">
                                                    {entity}
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex items-center justify-end">
                                            <Link href="/collections" className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                                                Try automating this →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
