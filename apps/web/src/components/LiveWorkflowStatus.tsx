"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Shield,
    Brain,
    GitBranch,
    FileJson,
    Camera,
    Zap,
    ArrowRight,
} from 'lucide-react';
import {
    IconBuilding,
    IconBuildingStore,
    IconCashBanknote,
    IconDatabase,
    IconFileText,
    IconFileTypePdf,
    IconLink,
    IconPackage,
    IconPdf,
    IconSparkles,
    IconUpload,
    IconUserPlus,
    IconUsers,
} from '@tabler/icons-react';
import { siGmail, siGoogledrive, siGooglegemini, siWhatsapp } from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type LiveStatusStep =
    | 'guard_passed'
    | 'intent_analyzed'
    | 'planned'
    | 'generated'
    | 'screenshot'
    | 'executed';
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

const AGENT_STEPS = [
    { id: 'guard_passed', label: 'Agent 0 (Guard)', sublabel: 'Safety check' },
    { id: 'intent_analyzed', label: 'Agent 1 (Intent)', sublabel: 'Analyzing Intent & Schema' },
    { id: 'planned', label: 'Agent 2 (Planner)', sublabel: 'Planning Workflow Nodes' },
    { id: 'generated', label: 'Agent 3 (n8n)', sublabel: 'Generating n8n JSON' },
    { id: 'screenshot', label: 'System', sublabel: 'Capturing Screenshot' },
    { id: 'executed', label: 'System', sublabel: 'Execution & Verification' },
];

const STEP_ICONS: Record<string, React.ElementType> = {
    guard_passed: Shield,
    intent_analyzed: Brain,
    planned: GitBranch,
    generated: FileJson,
    screenshot: Camera,
    executed: Zap,
};

// Get the action/result for the right panel based on current agent
function getActiveAgentAction(
    logs: LiveLog[],
    currentStep: LiveStatusStep | null,
    result: any | null
): {
    agentId: string;
    agentLabel: string;
    action: string;
    details?: { key: string; value: string }[];
    nodes?: { id: string; function: string; description: string }[];
    contextDocs?: string[];
} | null {
    if (!currentStep) {
        const firstLog = logs.find(l => l.type === 'log' && l.data?.includes?.('[Agent 0]'));
        if (firstLog) {
            return {
                agentId: 'guard_passed',
                agentLabel: 'Agent 0 (Guard)',
                action: 'Checking safety of your request...',
            };
        }
        return { agentId: 'guard_passed', agentLabel: 'Agent 0 (Guard)', action: 'Initializing...' };
    }

    const stepMeta = AGENT_STEPS.find(s => s.id === currentStep);
    if (!stepMeta) return null;

    if (currentStep === 'guard_passed') {
        const safeLog = logs.find(l => l.type === 'log' && (l.data === '  > Request is Safe. Proceeding...' || (l.data && String(l.data).includes('Safe'))));
        return {
            agentId: 'guard_passed',
            agentLabel: 'Agent 0 (Guard)',
            action: safeLog ? 'Request is safe. Proceeding...' : 'Checking Safety...',
            details: safeLog ? [{ key: 'Status', value: 'Safe' }] : undefined,
        };
    }

    if (currentStep === 'intent_analyzed') {
        const stepLog = logs.find(l => l.type === 'step' && l.status === 'intent_analyzed' && l.data);
        const d = stepLog?.data;
        const requiredDocs = Array.isArray(d?.required_docs)
            ? d.required_docs.filter((doc: unknown) => typeof doc === 'string')
            : [];
        if (d) {
            return {
                agentId: 'intent_analyzed',
                agentLabel: 'Agent 1 (Intent)',
                action: d.intent || 'Intent analyzed',
                details: [
                    d.title && { key: 'Title', value: d.title },
                    d.target_table && { key: 'Target Table', value: d.target_table },
                ].filter(Boolean) as { key: string; value: string }[],
                contextDocs: requiredDocs,
            };
        }
        return {
            agentId: 'intent_analyzed',
            agentLabel: 'Agent 1 (Intent)',
            action: 'Analyzing intent & schema...',
            contextDocs: [],
        };
    }

    if (currentStep === 'planned') {
        const stepLog = logs.find(l => l.type === 'step' && l.status === 'planned' && l.data);
        const d = stepLog?.data;
        if (d?.nodes?.length) {
            const nodes = d.nodes.map((n: { id?: string; function?: string; description?: string }) => ({
                id: n.id || '',
                function: n.function || 'unknown',
                description: n.description || '',
            }));
            return {
                agentId: 'planned',
                agentLabel: 'Agent 2 (Planner)',
                action: `Generated ${d.node_count ?? nodes.length} workflow nodes`,
                nodes,
            };
        }
        return {
            agentId: 'planned',
            agentLabel: 'Agent 2 (Planner)',
            action: 'Planning workflow nodes...',
        };
    }

    if (currentStep === 'generated') {
        const stepLog = logs.find(l => l.type === 'step' && l.status === 'generated');
        const d = stepLog?.data;
        return {
            agentId: 'generated',
            agentLabel: 'Agent 3 (n8n)',
            action: d?.json_length ? `n8n JSON generated (${d.json_length} chars)` : 'Generating n8n workflow...',
        };
    }

    if (currentStep === 'screenshot') {
        const stepLog = logs.find(l => l.type === 'step' && l.status === 'screenshot');
        return {
            agentId: 'screenshot',
            agentLabel: 'System',
            action: stepLog?.data?.url ? 'Screenshot captured' : 'Capturing screenshot...',
        };
    }

    if (currentStep === 'executed' && result) {
        return {
            agentId: 'executed',
            agentLabel: 'System',
            action: 'Workflow executed successfully',
            details: result.n8n_workflow_id ? [{ key: 'Workflow ID', value: result.n8n_workflow_id }] : undefined,
        };
    }

    return {
        agentId: currentStep,
        agentLabel: stepMeta.label,
        action: stepMeta.sublabel,
    };
}

function formatExecutionLog(log: LiveLog): string {
    if (log.type === 'step') {
        if (log.status === 'screenshot' && log.data?.url) {
            return 'Screenshot captured successfully';
        }
        if (log.status === 'executed' && log.data?.result?.n8n_workflow_id) {
            return `Workflow executed (ID: ${log.data.result.n8n_workflow_id})`;
        }
        if (typeof log.data === 'string' && log.data.trim()) {
            return log.data;
        }
        if (log.status) {
            const statusLabel = AGENT_STEPS.find(step => step.id === log.status)?.sublabel;
            return statusLabel || 'Step completed';
        }
        return 'Step completed';
    }

    if (typeof log.data === 'string' && log.data.trim()) {
        return log.data;
    }

    if (log.data && typeof log.data === 'object') {
        try {
            return JSON.stringify(log.data);
        } catch {
            return 'Log received';
        }
    }

    return 'Log received';
}

function getDocDisplayName(doc: string): string {
    const filename = doc.split('/').pop() || doc;
    return filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
}

function OfficialBrandIcon({ icon, className }: { icon: SimpleIcon; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
            <path d={icon.path} fill={`#${icon.hex}`} />
        </svg>
    );
}

function getContextDocMeta(doc: string): {
    iconType: 'official' | 'tabler';
    brandIcon?: SimpleIcon;
    Icon?: React.ElementType;
    iconClassName?: string;
} {
    const normalized = doc.toLowerCase();
    const fileName = (doc.split('/').pop() || doc).toLowerCase();

    if (fileName === 'email_tool.md') {
        return {
            iconType: 'official',
            brandIcon: siGmail,
        };
    }

    if (fileName === 'llm_tool.md') {
        return {
            iconType: 'official',
            brandIcon: siGooglegemini,
        };
    }

    if (fileName === 'whatsapp.md') {
        return {
            iconType: 'official',
            brandIcon: siWhatsapp,
        };
    }

    if (fileName === 'upload_file_tool.md') {
        return {
            iconType: 'official',
            brandIcon: siGoogledrive,
        };
    }

    if (fileName === 'pdf_reader_tool.md') {
        return {
            iconType: 'tabler',
            Icon: IconPdf,
            iconClassName: 'text-[#ff2d55]',
        };
    }

    if (fileName === 'database.md') {
        return {
            iconType: 'tabler',
            Icon: IconDatabase,
            iconClassName: 'text-amber-500',
        };
    }

    if (fileName === 'sale.md') {
        return {
            iconType: 'tabler',
            Icon: IconBuildingStore,
            iconClassName: 'text-orange-500',
        };
    }

    if (fileName === 'product.md') {
        return {
            iconType: 'tabler',
            Icon: IconPackage,
            iconClassName: 'text-cyan-500',
        };
    }

    if (fileName === 'pay_roll.md') {
        return {
            iconType: 'tabler',
            Icon: IconCashBanknote,
            iconClassName: 'text-lime-500',
        };
    }

    if (fileName === 'onboarding.md') {
        return {
            iconType: 'tabler',
            Icon: IconUserPlus,
            iconClassName: 'text-blue-500',
        };
    }

    if (fileName === 'employee.md' || fileName === 'customer.md') {
        return {
            iconType: 'tabler',
            Icon: IconUsers,
            iconClassName: 'text-teal-500',
        };
    }

    if (fileName === 'company.md') {
        return {
            iconType: 'tabler',
            Icon: IconBuilding,
            iconClassName: 'text-indigo-500',
        };
    }

    if (normalized.includes('node_connectors') || fileName.includes('-to-')) {
        return {
            iconType: 'tabler',
            Icon: IconLink,
            iconClassName: 'text-indigo-500',
        };
    }

    if (normalized.includes('email')) {
        return {
            iconType: 'official',
            brandIcon: siGmail,
        };
    }

    if (normalized.includes('llm') || normalized.includes('gemini')) {
        return {
            iconType: 'official',
            brandIcon: siGooglegemini,
        };
    }

    if (normalized.includes('whatsapp')) {
        return {
            iconType: 'official',
            brandIcon: siWhatsapp,
        };
    }

    if (normalized.includes('pdf')) {
        return {
            iconType: 'tabler',
            Icon: IconFileTypePdf,
            iconClassName: 'text-red-500',
        };
    }

    if (normalized.includes('upload')) {
        return {
            iconType: 'tabler',
            Icon: IconUpload,
            iconClassName: 'text-sky-500',
        };
    }

    if (normalized.includes('db') || normalized.includes('schema') || normalized.includes('table')) {
        return {
            iconType: 'tabler',
            Icon: IconDatabase,
            iconClassName: 'text-amber-500',
        };
    }

    return {
        iconType: 'tabler',
        Icon: IconFileText,
        iconClassName: 'text-zinc-500',
    };
}

function ContextDocsMarquee({ docs }: { docs: string[] }) {
    if (!docs.length) return null;

    const hasMultiple = docs.length > 1;
    const displayDocs = hasMultiple ? [...docs, ...docs] : docs;

    return (
        <div className="relative overflow-hidden py-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent" />
            <motion.div
                className="flex w-max items-center gap-5 py-2"
                animate={hasMultiple ? { x: ['-50%', '0%'] } : undefined}
                transition={hasMultiple ? { duration: 22, repeat: Infinity, ease: 'linear' } : undefined}
            >
                {displayDocs.map((doc, idx) => {
                    const meta = getContextDocMeta(doc);
                    return (
                        <div key={`${doc}-${idx}`} className="shrink-0">
                            <Card className="w-44 h-36 p-4 gap-2 shadow-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                                    <div className="flex items-center justify-center">
                                        {meta.iconType === 'official' && meta.brandIcon ? (
                                            <OfficialBrandIcon icon={meta.brandIcon} className="w-14 h-14" />
                                        ) : (
                                            meta.Icon && <meta.Icon className={cn('w-14 h-14', meta.iconClassName)} />
                                        )}
                                    </div>
                                    <p className="mt-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight capitalize px-1">
                                        {getDocDisplayName(doc)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}

// Animated node flow: Node1 ----> Node2 ----> Node3 ----> Node4 (horizontal with visible connectors)
function AnimatedNodeFlow({ nodes }: { nodes: { id: string; function: string; description: string }[] }) {
    const hasMultiple = nodes.length > 3;
    const displayNodes = hasMultiple ? [...nodes, ...nodes] : nodes;

    return (
        <div className="relative overflow-hidden py-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent" />
            <motion.div
                className="flex items-center flex-nowrap gap-0 py-4 min-w-max"
                animate={hasMultiple ? { x: ['-50%', '0%'] } : undefined}
                transition={hasMultiple ? { duration: 24, repeat: Infinity, ease: 'linear' } : undefined}
            >
                {displayNodes.map((node, i) => (
                    <React.Fragment key={`${node.id}-${i}`}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: (i % nodes.length) * 0.12 }}
                            className="flex flex-col items-center min-w-[180px] max-w-[280px] shrink-0"
                        >
                            <Card className="w-full py-3 px-4 gap-2">
                                <CardContent className="p-0">
                                    <p className="text-xs font-mono font-semibold break-words">
                                        {node.function}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed break-words whitespace-normal">
                                        {node.description}
                                    </p>
                                </CardContent>
                            </Card>
                            <Badge variant="outline" className="mt-1.5 text-[9px] font-medium">
                                Node {(i % nodes.length) + 1}
                            </Badge>
                        </motion.div>
                        {i < displayNodes.length - 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.25, delay: (i % nodes.length) * 0.12 + 0.15 }}
                                className="flex items-center shrink-0 px-3"
                            >
                                <div className="h-0.5 w-8 bg-zinc-300 dark:bg-zinc-600 rounded" />
                                <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 -ml-1 flex-shrink-0" />
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
}

export function LiveWorkflowStatus({
    logs,
    currentStep,
    isOpen,
    onClose,
    result,
    isCollapsed,
    onToggleCollapse
}: LiveWorkflowStatusProps) {
    const flowRef = useRef<HTMLDivElement>(null);
    const activeAction = getActiveAgentAction(logs, currentStep, result);

    useEffect(() => {
        if (flowRef.current) {
            flowRef.current.scrollTop = flowRef.current.scrollHeight;
        }
    }, [logs.length, currentStep]);

    if (!isOpen) return null;

    const getStepStatus = (stepId: string): 'completed' | 'active' | 'pending' => {
        const stepOrder = AGENT_STEPS.map(s => s.id);
        const currentIndex = currentStep ? stepOrder.indexOf(currentStep) : -1;
        const stepIndex = stepOrder.indexOf(stepId);

        if (result && stepId === 'executed') return 'completed';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    const currentLabel = AGENT_STEPS.find(s => s.id === currentStep)?.label || 'Initializing...';
    const isCompleted = Boolean(result);
    const screenshotUrl = logs.find(log => log.type === 'step' && log.status === 'screenshot')?.data?.url;
    const executionLogs = logs.filter(log => log.type === 'step' || log.type === 'log');

    // Collapsed View
    if (isCollapsed) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 w-80 cursor-pointer"
                onClick={onToggleCollapse}
            >
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="py-4 px-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${result ? 'bg-emerald-500' : 'bg-primary animate-pulse'}`} />
                                <CardTitle className="text-sm font-semibold">
                                    {result ? 'Workflow Ready' : 'Building Workflow...'}
                                </CardTitle>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {currentStep
                                    ? `${AGENT_STEPS.findIndex(s => s.id === currentStep) + 1}/${AGENT_STEPS.length}`
                                    : '0/6'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                            {result ? 'Click to view' : currentLabel}
                        </p>
                        <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground truncate">
                                {activeAction?.action || 'Waiting...'}
                            </p>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>
        );
    }

    // Full Page View (positioned to the right of sidebar w-64)
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 right-0 bottom-0 left-64 z-40 bg-white dark:bg-zinc-900 flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {isCompleted ? 'Workflow Completed' : 'AI Thought Process'}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {isCompleted ? 'Review the output, then click Done to return to Agent Creator' : 'Agents working in sequence'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isCompleted && (
                            <button
                                onClick={onToggleCollapse}
                                className="p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                                title="Minimize"
                            >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="w-5 h-5">
                                    <path d="M2 9h11v1H2V9z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        {isCompleted && (
                            <button
                                onClick={onClose}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>

                {isCompleted ? (
                    <div className="flex-1 min-h-0 p-8">
                        <div className="grid h-full grid-cols-1 gap-6 xl:grid-cols-2">
                            <Card className="min-h-0">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Final Screenshot
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {screenshotUrl ? (
                                        <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                            <img
                                                src={screenshotUrl}
                                                alt="Workflow execution screenshot"
                                                className="w-full max-h-[70vh] object-contain bg-zinc-50 dark:bg-zinc-900"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-64 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-sm text-zinc-500">
                                            No screenshot available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="min-h-0 flex flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Execution Log Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 flex-1 min-h-0">
                                    <ScrollArea className="h-full pr-1">
                                        <div className="space-y-2">
                                            {executionLogs.map((log, index) => {
                                                const stepLabel = log.status
                                                    ? AGENT_STEPS.find(step => step.id === log.status)?.label || 'Step'
                                                    : 'Log';
                                                const isStep = log.type === 'step';

                                                return (
                                                    <div
                                                        key={`${log.timestamp}-${index}`}
                                                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-3 py-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-2 min-w-0">
                                                                {isStep ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                                ) : (
                                                                    <Circle className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                                                                )}
                                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">
                                                                    {formatExecutionLog(log)}
                                                                </p>
                                                            </div>
                                                            <Badge variant={isStep ? 'default' : 'secondary'} className="shrink-0">
                                                                {stepLabel}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Horizontal agent line at top - growing nodes, dynamic arrows */}
                        <div className="shrink-0 border-b px-8 py-5 bg-muted/30">
                            <div className="flex items-center min-w-max">
                                {AGENT_STEPS.map((step, idx) => {
                                    const status = getStepStatus(step.id);
                                    const Icon = STEP_ICONS[step.id] ?? Circle;
                                    const connectorFromCompleted = idx > 0 && getStepStatus(AGENT_STEPS[idx - 1].id) === 'completed';

                                    return (
                                        <React.Fragment key={step.id}>
                                            <motion.div
                                                layout
                                                initial={false}
                                                animate={{
                                                    scale: status === 'active' ? 1.05 : 1,
                                                    transition: { duration: 0.3 },
                                                }}
                                                className="flex flex-col items-center shrink-0"
                                            >
                                                <div
                                                    className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-300
                                                        ${status === 'active' ? 'w-10 h-10' : 'w-8 h-8'}
                                                        ${status === 'completed' ? 'bg-emerald-500 text-white' : ''}
                                                        ${status === 'active' ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/25' : ''}
                                                        ${status === 'pending' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500' : ''}
                                                    `}
                                                >
                                                    {status === 'completed' ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : status === 'active' ? (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.14, 1] }}
                                                            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                                            whileHover={{ scale: 1.2 }}
                                                            className="relative flex items-center justify-center"
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                            <motion.span
                                                                className="absolute inset-0 rounded-full border border-white/70"
                                                                animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                                                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                                                            />
                                                        </motion.div>
                                                    ) : (
                                                        <Icon className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="mt-2 text-center max-w-[120px]">
                                                    {status === 'active' ? (
                                                        <motion.h3
                                                            key="active-title"
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="font-medium text-sm text-indigo-600 dark:text-indigo-400 leading-tight"
                                                        >
                                                            {step.sublabel}
                                                        </motion.h3>
                                                    ) : (
                                                        <>
                                                            <h3
                                                                className={`font-medium text-sm whitespace-nowrap
                                                                    ${status === 'completed' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}
                                                                `}
                                                            >
                                                                {step.label}
                                                            </h3>
                                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                                                {step.sublabel}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                            {idx < AGENT_STEPS.length - 1 && (
                                                <div className="flex items-center shrink-0 mx-2 self-start mt-4 overflow-hidden">
                                                    <div className="relative h-0.5 min-w-[32px] w-12 rounded bg-zinc-200 dark:bg-zinc-700">
                                                        {(connectorFromCompleted || status === 'active') && (
                                                            <motion.div
                                                                className="absolute inset-y-0 left-0 rounded bg-indigo-500 dark:bg-indigo-500"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: '100%' }}
                                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                style={{ originX: 0 }}
                                                            />
                                                        )}
                                                    </div>
                                                    <motion.div
                                                        animate={connectorFromCompleted ? { opacity: [0.6, 1, 0.6] } : {}}
                                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                    >
                                                        <ArrowRight
                                                            className={`w-3.5 h-3.5 flex-shrink-0 -ml-2 transition-colors
                                                                ${connectorFromCompleted ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}
                                                            `}
                                                        />
                                                    </motion.div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action visual below */}
                        <div className="flex-1 flex flex-col min-w-0 min-h-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-8 py-4 shrink-0">
                                Current action
                            </p>
                            <ScrollArea className="flex-1">
                                <div ref={flowRef} className="flex-1 p-8 flex flex-col gap-6">
                                    {activeAction ? (
                                        <motion.div
                                            key={activeAction.agentId}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col gap-6"
                                        >
                                            {/* Node flow on top - horizontal */}
                                            {activeAction.nodes && activeAction.nodes.length > 0 && (
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                            Workflow flow
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <ScrollArea className="w-full">
                                                            <AnimatedNodeFlow nodes={activeAction.nodes} />
                                                            <ScrollBar orientation="horizontal" />
                                                        </ScrollArea>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* AI thoughts / action - clean layout without repeated icon */}
                                            <div className="border-l-4 border-indigo-500 pl-5 py-2">
                                                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {activeAction.agentLabel}
                                                </h4>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                    {activeAction.action}
                                                </p>
                                            </div>

                                            {activeAction.details && activeAction.details.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {activeAction.details.map(({ key, value }) => (
                                                        <Badge key={key} variant="secondary" className="font-normal">
                                                            <span className="font-medium">{key}:</span> {value}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {activeAction.contextDocs && activeAction.contextDocs.length > 0 && (
                                                <div className="pt-1">
                                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                                                        Context docs loading
                                                    </p>
                                                    <ContextDocsMarquee docs={activeAction.contextDocs} />
                                                </div>
                                            )}

                                            {/* Screenshot preview */}
                                            {currentStep === 'screenshot' && screenshotUrl && (
                                                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                                    <img
                                                        src={screenshotUrl}
                                                        alt="Workflow"
                                                        className="w-full h-48 object-contain bg-zinc-50 dark:bg-zinc-900"
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-24 text-zinc-400 dark:text-zinc-500"
                                        >
                                            <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                                <motion.div
                                                    animate={{ scale: [1, 1.12, 1] }}
                                                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                                    whileHover={{ scale: 1.2 }}
                                                    className="relative flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                                                >
                                                    <Shield className="w-10 h-10" />
                                                    <motion.span
                                                        className="absolute inset-1 rounded-full border border-indigo-400/60 dark:border-indigo-300/50"
                                                        animate={{ scale: [1, 1.65], opacity: [0.7, 0] }}
                                                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                                                    />
                                                </motion.div>
                                            </div>
                                            <p className="text-base font-medium">Starting agents...</p>
                                            <p className="text-sm mt-2">Agent 0 (Guard) will check your request first</p>
                                        </motion.div>
                                    )}
                                </div>
                            </ScrollArea>

                            {screenshotUrl && (
                                <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-100/50 dark:bg-zinc-900/50">
                                    <p className="text-sm font-medium text-zinc-500 mb-3">Live Preview</p>
                                    <img
                                        src={screenshotUrl}
                                        alt="Workflow"
                                        className="h-32 w-auto rounded-lg border border-zinc-200 dark:border-zinc-700 shadow"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
