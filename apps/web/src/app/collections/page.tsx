"use client";

import { WorkflowCollection } from "@/components/WorkflowCollection";
import { useWorkflow } from "@/context/WorkflowContext";

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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Workflow Collections
                </h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    Manage and run your active n8n agentic workflows.
                </p>
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
