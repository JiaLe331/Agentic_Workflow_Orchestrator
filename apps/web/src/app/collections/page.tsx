"use client";

import { WorkflowCollection } from "@/components/WorkflowCollection";
import { useWorkflow } from "@/context/WorkflowContext";

import Link from "next/link";
import { Database, Zap } from "lucide-react";

export default function CollectionsPage() {
    const { workflows } = useWorkflow();

    const handleRun = (id: string) => {
        alert(`Running workflow ${id}`);
    };

    const handleView = (id: string) => {
        alert(`View Details for ${id}`);
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Workflow Collections
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Manage and run your active n8n agentic workflows.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/capabilities"
                        className="flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <Zap className="mr-2 h-4 w-4 text-amber-500" />
                        Capabilities
                    </Link>
                    <Link
                        href="/entity-map"
                        className="flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <Database className="mr-2 h-4 w-4 text-pink-600" />
                        View Data Schema
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        No workflows created yet. Go to Agent Creator to build one.
                    </div>
                ) : (
                    workflows.map((item) => (
                        <WorkflowCollection key={item.id} item={item} onRun={handleRun} onView={handleView} />
                    ))
                )}
            </div>
        </div>
    );
}
