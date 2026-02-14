"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Terminal } from "lucide-react";
import { useWorkflow, type WorkflowItem } from "@/context/WorkflowContext";
import { DynamicRenderer, type UIComponent } from "@/components/DynamicRenderer";
import mockData from "@/mocks/entity-mock.json";

export default function AgentExecutionPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { workflows } = useWorkflow();
    const [workflow, setWorkflow] = useState<WorkflowItem | null>(null);
    const [inputs, setInputs] = useState<Record<string, string | File>>({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLayout, setExecutionLayout] = useState<UIComponent[] | null>(null);

    const [id, setId] = useState<string>("");

    useEffect(() => {
        params.then((p) => {
            setId(p.id);
            const found = workflows.find((w) => w.id === p.id);
            if (found) {
                setWorkflow(found);
                if (found.inputs) {
                    const initial: Record<string, string> = {};
                    found.inputs.forEach(i => initial[i.key] = "");
                    setInputs(initial);
                }
            }
        });
    }, [params, workflows]);

    if (!workflow && id) {
        return <div className="p-8">Loading agent...</div>;
    }

    if (!workflow) return null;

    const handleExecute = () => {
        setIsExecuting(true);
        setExecutionLayout(null);

        // Mock Response Data based on department
        // In a real app, this would come from the backend based on agent ID
        const mockResponse: UIComponent[] = mockData.responses.default as unknown as UIComponent[];

        setTimeout(() => {
            setIsExecuting(false);
            setExecutionLayout(mockResponse);
        }, 2000);
    };

    return (
        <div className="mx-auto max-w-6xl p-8">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Collections
            </button>

            <div className="mb-8 border-b border-zinc-200 pb-8 dark:border-zinc-800">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{workflow.title}</h1>
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{workflow.description}</p>
                <div className="mt-4 flex gap-2">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {workflow.department}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        v2.1.0-dynamic
                    </span>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Input Section (Left Column) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-8">
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80 dark:backdrop-blur-xl">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <h2 className="flex items-center text-lg font-semibold text-zinc-900 dark:text-white">
                                    <Terminal className="mr-2 h-5 w-5 text-emerald-500" />
                                    Input Parameters
                                </h2>
                            </div>

                            <div className="p-6">
                                {workflow.inputs && workflow.inputs.length > 0 ? (
                                    <div className="space-y-6">
                                        {workflow.inputs.map((input) => (
                                            <div key={input.key} className="group">
                                                <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                    {input.label}
                                                    {input.required && <span className="ml-1 text-red-500">*</span>}
                                                </label>

                                                {input.type === 'file' || input.type === 'image' ? (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            id={`file-${input.key}`}
                                                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setInputs({ ...inputs, [input.key]: e.target.files[0] });
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 py-6 text-center transition-all peer-hover:border-emerald-500 peer-hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:peer-hover:border-emerald-500/50 dark:peer-hover:bg-emerald-900/20">
                                                            <div className="mb-2 rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                                                                <ArrowLeft className="h-5 w-5 rotate-90 text-zinc-500 dark:text-zinc-400" />
                                                            </div>
                                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                                {(inputs[input.key] as File)?.name || "Click to upload file"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                                PDF, DOCX, or Images (max 10MB)
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type={input.type || "text"}
                                                            value={inputs[input.key] as string || ""}
                                                            onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                                                            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-emerald-500 dark:focus:bg-zinc-900"
                                                            placeholder={`Enter ${input.label.toLowerCase()}...`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-10 dark:border-zinc-800">
                                        <p className="text-zinc-500">No inputs required.</p>
                                        <p className="text-xs text-zinc-400">Ready to execute.</p>
                                    </div>
                                )}

                                <div className="mt-8">
                                    <button
                                        onClick={handleExecute}
                                        disabled={isExecuting}
                                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                                        {isExecuting ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Running Agent...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4 fill-current" />
                                                Execute Workflow
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Section (Right Column) */}
                <div className="lg:col-span-8">
                    <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">Execution Output</h2>
                    <div className="min-h-[400px] rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-950/50">
                        {executionLayout ? (
                            <DynamicRenderer layout={executionLayout} />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
                                {isExecuting ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                                        <p>Processing with n8n agents...</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Play className="mx-auto mb-2 h-10 w-10 opacity-20" />
                                        <p>Run the workflow to see results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}