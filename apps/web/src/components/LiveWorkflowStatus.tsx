import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Terminal, X } from 'lucide-react';

export type LiveStatusStep = 'intent_analyzed' | 'planned' | 'generated' | 'screenshot' | 'executed';
export type LiveLog = { type: string; data: any; timestamp: number; status?: LiveStatusStep };

interface LiveWorkflowStatusProps {
    logs: LiveLog[];
    currentStep: LiveStatusStep | null;
    isOpen: boolean;
    onClose: () => void;
    result: any | null;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const steps = [
    { id: 'intent_analyzed', label: 'Analyzing Intent' },
    { id: 'planned', label: 'Planning Nodes' },
    { id: 'generated', label: 'Generating Workflow' },
    { id: 'screenshot', label: 'Capturing Screenshot' },
    { id: 'executed', label: 'Execution & Verification' },
];

export function LiveWorkflowStatus({
    logs,
    currentStep,
    isOpen,
    onClose,
    result,
    isCollapsed,
    onToggleCollapse
}: LiveWorkflowStatusProps) {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isOpen) return null;

    const getStepStatus = (stepId: string) => {
        const stepOrder = steps.map(s => s.id);
        const currentIndex = currentStep ? stepOrder.indexOf(currentStep) : -1;
        const stepIndex = stepOrder.indexOf(stepId);

        if (result && stepId === 'executed') return 'completed'; // Final step done
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    const currentStepLabel = steps.find(s => s.id === currentStep)?.label || 'Initializing...';

    // Collapsed View
    if (isCollapsed) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 w-80 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={onToggleCollapse}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`
                            w-2 h-2 rounded-full
                            ${result ? 'bg-green-500' : 'bg-emerald-500 animate-pulse'}
                        `} />
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            {result ? 'Workflow Ready' : 'Building Workflow...'}
                        </span>
                    </div>
                    {/* Tiny progress indicator */}
                    <span className="text-xs text-zinc-500">
                        {currentStep ? `${steps.findIndex(s => s.id === currentStep) + 1}/${steps.length}` : '0/5'}
                    </span>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {result ? 'Click to view result' : currentStepLabel}
                </div>

                {/* Mini terminal line */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="font-mono text-[10px] text-zinc-400 truncate">
                        {logs[logs.length - 1]?.data?.toString() || 'Waiting for logs...'}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Expanded View
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4"
                onClick={(e) => {
                    // Collapse on backdrop click
                    if (e.target === e.currentTarget) {
                        onToggleCollapse();
                    }
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800"
                    onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <Loader2 className={`w-5 h-5 ${!result ? 'animate-spin' : ''}`} />
                                {result ? 'Workflow Generated Successfully' : 'AI is Thinking...'}
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Constructing your automated workflow in real-time
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onToggleCollapse}
                                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                                title="Minimize"
                            >
                                <span className="sr-only">Minimize</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"><path d="M2 9h11v1H2V9z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </button>
                            {result && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Steps Timeline - Left Side */}
                        <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto">
                            <div className="space-y-6">
                                {steps.map((step) => {
                                    const status = getStepStatus(step.id);
                                    return (
                                        <div key={step.id} className="relative flex gap-4">
                                            {/* Line connector */}
                                            <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-zinc-200 dark:bg-zinc-800 last:hidden" />

                                            <div className={`
                        relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${status === 'completed' ? 'bg-green-500 text-white' :
                                                    status === 'active' ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' :
                                                        'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}
                      `}>
                                                {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                                                    status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                        <Circle className="w-4 h-4" />}
                                            </div>

                                            <div>
                                                <h3 className={`font-medium ${status === 'active' ? 'text-emerald-600 dark:text-emerald-400' :
                                                    status === 'completed' ? 'text-zinc-900 dark:text-zinc-100' :
                                                        'text-zinc-400 dark:text-zinc-600'
                                                    }`}>
                                                    {step.label}
                                                </h3>
                                                {status === 'active' && (
                                                    <motion.p
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                        className="text-xs text-zinc-500 mt-1"
                                                    >
                                                        Processing...
                                                    </motion.p>
                                                )}
                                                {/* Specific details for steps */}
                                                {step.id === 'intent_analyzed' && status !== 'pending' && logs.find(l => l.data?.intent) && (
                                                    <div className="mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-zinc-600 dark:text-zinc-300">
                                                        Intent: {logs.find(l => l.data?.intent)?.data.intent}
                                                    </div>
                                                )}
                                                {step.id === 'executed' && result && (
                                                    <div className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 p-2 rounded text-green-700 dark:text-green-300">
                                                        Workflow ID: {result.n8n_workflow_id}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Terminal / Output - Right Side */}
                        <div className="w-2/3 flex flex-col bg-zinc-950">
                            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2" ref={terminalRef}>
                                {logs.map((log, i) => (
                                    <div key={i} className="break-words">
                                        <span className="text-zinc-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                                        {log.type === 'log' && <span className="text-zinc-300">{log.data}</span>}
                                        {log.type === 'step' && <span className="text-cyan-400 font-bold">Step: {log.status}</span>}
                                        {log.type === 'step' && typeof log.data === 'object' && (
                                            <pre className="text-xs text-zinc-500 mt-1 pl-4 overflow-x-auto">
                                                {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                                {currentStep && !result && (
                                    <div className="animate-pulse text-zinc-500">_</div>
                                )}
                            </div>

                            {/* Preview Image Area (if screenshot available) */}
                            {logs.find(l => l.status === 'screenshot')?.data?.url && (
                                <div className="h-48 border-t border-zinc-800 bg-zinc-900 p-4 relative group">
                                    <p className="text-xs text-zinc-500 mb-2 absolute top-2 left-4">Live Preview</p>
                                    <img
                                        src={logs.find(l => l.status === 'screenshot')?.data.url}
                                        alt="Workflow Preview"
                                        className="h-full w-auto mx-auto rounded shadow-lg border border-zinc-700"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
