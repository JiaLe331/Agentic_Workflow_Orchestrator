
import { IconX, IconTrash, IconPencil, IconPlayerPlay, IconArrowRight, IconTable, IconRobot, IconDatabase, IconCheck, IconLoader2, IconBrain, IconAi, IconSettings, IconCode, IconFileTextFilled, IconFileTextAi, IconMessageDots, IconTerminal, IconCopy, IconJson, IconChevronDown, IconEdit, IconUpload, IconFileTypePdf, IconInfoCircle } from '@tabler/icons-react';
import { Workflow } from '@/hooks/use-workflows';
import { formatTimeAgo } from '@/lib/utils';
import { Fragment, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface InputRequirement {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'pdf';
    required: boolean;
}

interface WorkflowDetailsSlideOverProps {
    workflow: Workflow | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (workflow: Workflow) => void;
    onDelete?: (id: string) => void;
    onRun?: (workflow: Workflow) => void;
}

// Map icon strings to components
const ICON_MAP: Record<string, any> = {
    'IconBrain': IconBrain,
    'IconDatabase': IconDatabase,
    'IconRobot': IconRobot,
    'IconLoader2': IconLoader2,
    'IconCheck': IconCheck,
    'IconSettings': IconSettings,
    'IconCode': IconCode
};

export function WorkflowDetailsSlideOver({
    workflow,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onRun
}: WorkflowDetailsSlideOverProps) {
    // Animation state for mock logs
    const [visibleSteps, setVisibleSteps] = useState<number>(0);
    // State for prompt popup
    const [showPromptPopup, setShowPromptPopup] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    // State for node config visibility
    const [showNodeConfig, setShowNodeConfig] = useState(false);
    // State for input requirements modal
    const [showInputModal, setShowInputModal] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Reset and animate steps when opened
    useEffect(() => {
        if (isOpen && workflow?.executionPlan) {
            setVisibleSteps(0);
            const interval = setInterval(() => {
                setVisibleSteps(prev => {
                    if (prev < (workflow.executionPlan?.length || 0)) return prev + 1;
                    clearInterval(interval);
                    return prev;
                });
            }, 250); // Reveal each step every 250ms
            return () => clearInterval(interval);
        } else {
            setVisibleSteps(0);
        }
        setShowPromptPopup(false); // Reset popup
    }, [isOpen, workflow]);

    const handleCopyPrompt = () => {
        if (workflow?.userPrompt) {
            navigator.clipboard.writeText(workflow.userPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // State for trigger status
    const [isTriggering, setIsTriggering] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);
    const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);
    const [lastRequestDetails, setLastRequestDetails] = useState<{ webhookUrl: string; body: Record<string, any>; method: string } | null>(null);
    const [showRequestDetails, setShowRequestDetails] = useState(false);

    const inputRequirements: InputRequirement[] = Array.isArray(
        (workflow as any)?.inputRequirements
    )
        ? (workflow as any).inputRequirements
        : [];

    const handleRunClick = () => {
        setTriggerError(null);
        setTriggerSuccess(null);

        // Check webhook_url exists
        if (!workflow?.webhookUrl) {
            setTriggerError('Cannot run: this workflow has no webhook URL configured.');
            return;
        }

        if (inputRequirements.length > 0) {
            // Reset form values
            const defaults: Record<string, any> = {};
            inputRequirements.forEach((req) => {
                if (req.type === 'boolean') defaults[req.name] = false;
                else if (req.type === 'pdf') defaults[req.name] = null;
                else defaults[req.name] = '';
            });
            setFormValues(defaults);
            setShowInputModal(true);
        } else {
            // No input requirements — trigger directly
            triggerWorkflow({});
        }
    };

    const triggerWorkflow = async (values: Record<string, any>) => {
        if (!workflow?.webhookUrl) {
            setTriggerError('Cannot run: this workflow has no webhook URL configured.');
            return;
        }

        setIsTriggering(true);
        setTriggerError(null);
        setTriggerSuccess(null);

        try {
            const formData = new FormData();
            formData.append('webhook_url', workflow.webhookUrl);
            formData.append('input_requirements', JSON.stringify(inputRequirements));

            // Build readable body for details display
            const bodySnapshot: Record<string, any> = {};

            // Append user inputs
            for (const [key, value] of Object.entries(values)) {
                if (value instanceof File) {
                    formData.append(key, value);
                    bodySnapshot[key] = `[File] ${value.name} (${(value.size / 1024).toFixed(1)} KB)`;
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                    bodySnapshot[key] = String(value);
                }
            }

            // Save request details
            setLastRequestDetails({
                webhookUrl: workflow.webhookUrl,
                body: bodySnapshot,
                method: 'POST',
            });
            setShowRequestDetails(false);

            const res = await fetch('/trigger-workflow', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || `Request failed with status ${res.status}`);
            }

            setTriggerSuccess(`Workflow triggered successfully! (Status: ${data.statusCode})`);
            setShowInputModal(false);
        } catch (err: any) {
            setTriggerError(err.message || 'Failed to trigger workflow');
        } finally {
            setIsTriggering(false);
        }
    };

    const handleFormSubmit = () => {
        triggerWorkflow(formValues);
    };

    const handleFormValueChange = (name: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const isFormValid = () => {
        return inputRequirements.every((req) => {
            if (!req.required) return true;
            const val = formValues[req.name];
            if (req.type === 'pdf') return val !== null && val !== undefined;
            if (req.type === 'boolean') return true; // boolean always has a value
            return val !== '' && val !== undefined;
        });
    };

    if (!isOpen || !workflow) return null;

    const executionPlan = workflow.executionPlan || [];

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Slide-over panel - WIDENED to max-w-5xl */}
                <div className="relative w-full max-w-5xl h-full bg-white dark:bg-gray-900 shadow-2xl flex transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right overflow-hidden">

                    {/* LEFT COLUMN: Mock Execution Log */}
                    <div className="w-[400px] bg-gray-950 text-gray-300 flex flex-col border-r border-gray-800 shrink-0">
                        <div className="p-6 border-b border-gray-800 bg-gray-950/50">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <IconFileTextAi className="text-blue-500" size={16} />
                                Execution Preview
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-mono text-xs">
                            {executionPlan.length > 0 ? (
                                executionPlan.map((step: any, index) => {
                                    // Determine display values based on structure (Legacy vs Node)
                                    const isNodeFormat = step.function && !step.agent;

                                    const title = isNodeFormat ? step.function : step.title;
                                    const agent = isNodeFormat ? `Node ${index + 1}` : step.agent;
                                    const description = isNodeFormat ? step.description : null;
                                    const IconComponent = ICON_MAP[step.icon] || (isNodeFormat ? IconCode : IconLoader2);

                                    return (
                                        <div
                                            key={step.id || index}
                                            className={cn(
                                                "transition-all duration-200 ease-out transform",
                                                index < visibleSteps ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                            )}
                                        >
                                            {/* Agent/Node Header */}
                                            <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold">
                                                <IconComponent size={14} />
                                                <span>[{agent}] {title}</span>
                                            </div>

                                            {/* Details */}
                                            <div className="pl-4 border-l border-gray-800 space-y-1.5 ml-1.5">
                                                {/* Render Description for Node Format */}
                                                {description && (
                                                    <div className="text-gray-400 italic mb-2">
                                                        {description}
                                                    </div>
                                                )}

                                                {/* Render Legacy Details */}
                                                {step.details && step.details.map((detail: any, i: number) => (
                                                    <div key={i} className="text-gray-400">
                                                        <span className="text-gray-500 mr-1">&gt;</span>
                                                        <span className="text-gray-300 font-semibold">{detail.label}:</span>{' '}
                                                        <span className="text-gray-500">{detail.value}</span>
                                                    </div>
                                                ))}

                                                {/* Render Node Parameters if available */}
                                                {isNodeFormat && step.parameters && Object.keys(step.parameters).length > 0 && (
                                                    <div className="text-gray-500 mt-1">
                                                        <span className="text-xs uppercase font-semibold text-gray-600">Parameters:</span>
                                                        <pre className="mt-1 text-[10px] text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto">
                                                            {JSON.stringify(step.parameters, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-gray-600 italic text-center mt-10">
                                    No execution plan available.
                                </div>
                            )}

                            {executionPlan.length > 0 && visibleSteps === executionPlan.length && (
                                <div className="animate-pulse text-green-500 pt-4 flex items-center gap-2">
                                    <IconCheck size={14} />
                                    <span>Plan Ready</span>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* RIGHT COLUMN: Existing Details */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 overflow-y-auto relative">

                        {workflow.imageUrl ? (
                            <div
                                className="h-48 w-full border-b border-gray-100 dark:border-gray-800 relative group shrink-0"
                                style={{
                                    backgroundImage: `url(${workflow.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent z-10 dark:from-gray-900/40"></div>
                            </div>
                        ) : (
                            <div className="h-32 w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0">
                                <IconTable className="w-12 h-12 text-gray-200 dark:text-gray-700" stroke={1.5} />
                            </div>
                        )}

                        {/* Content - Padded */}
                        <div className="p-8 space-y-8 flex-1">

                            {/* Title & Meta */}
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-3xl text-gray-900 dark:text-white mb-2 leading-tight">
                                        {workflow.title || 'Untitled Workflow'}
                                    </h1>
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mt-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                                    >
                                        <IconX size={24} />
                                    </button>
                                </div>

                                {/* Description */}
                                <div className='py-3'>
                                    <p className="text-gray-500 dark:text-gray-300 leading-relaxed text-base">
                                        {workflow.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-4">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                        workflow.uiType ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-gray-100 text-gray-600"
                                    )}>
                                        {workflow.uiType || 'No UI Type'}
                                    </span>
                                    <span className='text-xs text-gray-400/80'>Updated {formatTimeAgo(workflow.updatedAt)}</span>
                                </div>
                            </div>

                            {/* Tables Involved */}
                            {workflow.tablesInvolved && workflow.tablesInvolved.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                        Tables Involved
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {workflow.tablesInvolved.map((table) => (
                                            <div key={table} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                                <IconTable size={16} className="mr-2 text-gray-400" />
                                                {table}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Requirements */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    Input Requirements
                                </h3>
                                {workflow.inputRequirements && typeof workflow.inputRequirements === 'object' && Object.keys(workflow.inputRequirements).length > 0 ? (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 dark:bg-gray-800/50 dark:border-gray-700 space-y-3">
                                        {Object.entries(workflow.inputRequirements).map(([key, value]) => (
                                            <div key={key} className="flex items-start gap-3">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[100px] pt-0.5 shrink-0">
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {typeof value === 'object' ? (
                                                        <pre className="text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700 overflow-x-auto">
                                                            {JSON.stringify(value, null, 2)}
                                                        </pre>
                                                    ) : (
                                                        String(value)
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 dark:bg-gray-800/50 dark:border-gray-700 min-h-[60px] flex items-center justify-center text-gray-400 text-sm italic">
                                        No input requirements specified.
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    Results
                                </h3>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 dark:bg-gray-800/50 dark:border-gray-700 min-h-[100px] flex items-center justify-center text-gray-500 text-sm italic">
                                    {workflow.result || "No results available yet."}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm sticky bottom-0">
                            {/* Node Configuration above buttons */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowNodeConfig(!showNodeConfig)}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-600 transition-colors w-full group"
                                >
                                    <IconJson size={14} />
                                    <span>Node Configuration</span>
                                    <IconChevronDown
                                        size={16}
                                        className={cn(
                                            "ml-auto transition-transform duration-200",
                                            showNodeConfig && "rotate-180"
                                        )}
                                    />
                                </button>

                                {showNodeConfig && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-gray-900 dark:border-gray-700 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                                        <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                            {JSON.stringify(workflow.nodesJson, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Error / Success Feedback */}
                                {triggerError && (
                                    <div className="absolute bottom-full left-0 right-0 mx-6 mb-2">
                                        <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
                                            <span className="flex-1">{triggerError}</span>
                                            {lastRequestDetails && (
                                                <button
                                                    onClick={() => setShowRequestDetails(!showRequestDetails)}
                                                    className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                    title="View request details"
                                                >
                                                    <IconInfoCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {showRequestDetails && lastRequestDetails && (
                                            <div className="mt-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150 shadow-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-bold">{lastRequestDetails.method}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 truncate">{lastRequestDetails.webhookUrl}</span>
                                                </div>
                                                <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Body</span>
                                                    <pre className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{JSON.stringify(lastRequestDetails.body, null, 2)}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {triggerSuccess && (
                                    <div className="absolute bottom-full left-0 right-0 mx-6 mb-2">
                                        <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
                                            <IconCheck size={16} />
                                            <span className="flex-1">{triggerSuccess}</span>
                                            {lastRequestDetails && (
                                                <button
                                                    onClick={() => setShowRequestDetails(!showRequestDetails)}
                                                    className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                    title="View request details"
                                                >
                                                    <IconInfoCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {showRequestDetails && lastRequestDetails && (
                                            <div className="mt-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150 shadow-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-bold">{lastRequestDetails.method}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 truncate">{lastRequestDetails.webhookUrl}</span>
                                                </div>
                                                <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Body</span>
                                                    <pre className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{JSON.stringify(lastRequestDetails.body, null, 2)}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 1. Run Workflow (Always visible, LHS) */}
                                <button
                                    onClick={handleRunClick}
                                    disabled={isTriggering}
                                    className={cn(
                                        "flex-1 flex items-center justify-center px-4 py-3.5 text-sm font-bold text-white transition-all rounded-xl shadow-lg",
                                        isTriggering
                                            ? "bg-blue-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5"
                                    )}
                                >
                                    {isTriggering ? (
                                        <>
                                            <IconLoader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Triggering...
                                        </>
                                    ) : (
                                        <>
                                            <IconPlayerPlay className="w-5 h-5 mr-2" />
                                            Run
                                        </>
                                    )}
                                </button>

                                {/* 2. View n8n workflow (Visible if URL exists, RHS of Run) */}
                                {workflow.workflowUrl && (
                                    <a
                                        href={workflow.workflowUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center px-4 py-3.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm hover:shadow dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-blue-400 group"
                                        title="View n8n workflow"
                                    >
                                        <IconPencil className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" />
                                        <span>Customize</span>
                                    </a>
                                )}

                                {/* 2. View Prompt Button (with popup) */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowPromptPopup(!showPromptPopup)}
                                        className={cn(
                                            "flex items-center justify-center w-12 h-12 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm hover:shadow dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-blue-400",
                                            showPromptPopup && "bg-gray-100 dark:bg-gray-700 border-blue-200 ring-2 ring-blue-500/20"
                                        )}
                                        title="View User Prompt"
                                    >
                                        <IconTerminal size={20} />
                                    </button>

                                    {/* Popup - Adjusted position to anchor properly */}
                                    {showPromptPopup && (
                                        <div className="absolute bottom-full right-0 mb-3 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">User Prompt</span>
                                                <button
                                                    onClick={handleCopyPrompt}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    {isCopied ? <IconCheck size={14} className="text-green-500" /> : <IconCopy size={14} />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-300 dark:bg-gray-800 p-3 rounded-lg">
                                                {workflow.userPrompt || 'No prompt info available.'}
                                            </div>
                                            {/* Arrow pointer */}
                                            <div className="absolute top-full right-4 -mt-1.5 w-3 h-3 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Delete Button */}
                                <button
                                    onClick={() => onDelete && onDelete(workflow.id)}
                                    className="flex items-center justify-center w-12 h-12 text-red-600 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm hover:shadow dark:bg-gray-800 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-900/10"
                                    title="Delete Workflow"
                                >
                                    <IconTrash size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Requirements Modal */}
            {showInputModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowInputModal(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Input Requirements</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill in the required fields to run this workflow</p>
                            </div>
                            <button
                                onClick={() => setShowInputModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors dark:hover:bg-gray-700"
                            >
                                <IconX size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                            {inputRequirements.map((req) => (
                                <div key={req.name} className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {req.type === 'pdf' && <IconFileTypePdf size={16} className="text-red-500" />}
                                        <span>{req.name.replace(/_/g, ' ')}</span>
                                        {req.required && <span className="text-red-500 text-xs">*</span>}
                                    </label>

                                    {/* PDF Upload */}
                                    {req.type === 'pdf' && (
                                        <div
                                            onClick={() => fileInputRefs.current[req.name]?.click()}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                                                formValues[req.name]
                                                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20"
                                                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
                                            )}
                                        >
                                            <input
                                                ref={(el) => { fileInputRefs.current[req.name] = el; }}
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    handleFormValueChange(req.name, file);
                                                }}
                                            />
                                            {formValues[req.name] ? (
                                                <>
                                                    <IconFileTypePdf size={28} className="text-red-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {(formValues[req.name] as File).name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {((formValues[req.name] as File).size / 1024).toFixed(1)} KB — Click to change
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconUpload size={24} className="text-gray-400" />
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload PDF</span>
                                                    <span className="text-xs text-gray-400">PDF files only</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* String Input */}
                                    {req.type === 'string' && (
                                        <input
                                            type="text"
                                            value={formValues[req.name] || ''}
                                            onChange={(e) => handleFormValueChange(req.name, e.target.value)}
                                            placeholder={`Enter ${req.name.replace(/_/g, ' ')}`}
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-500 dark:placeholder-gray-500"
                                        />
                                    )}

                                    {/* Number Input */}
                                    {req.type === 'number' && (
                                        <input
                                            type="number"
                                            value={formValues[req.name] || ''}
                                            onChange={(e) => handleFormValueChange(req.name, e.target.value)}
                                            placeholder={`Enter ${req.name.replace(/_/g, ' ')}`}
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-500 dark:placeholder-gray-500"
                                        />
                                    )}

                                    {/* Boolean Toggle */}
                                    {req.type === 'boolean' && (
                                        <button
                                            type="button"
                                            onClick={() => handleFormValueChange(req.name, !formValues[req.name])}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white transition-all dark:bg-gray-800 dark:border-gray-700"
                                        >
                                            <div
                                                className={cn(
                                                    "w-10 h-6 rounded-full transition-colors relative",
                                                    formValues[req.name] ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                                                        formValues[req.name] ? "translate-x-[18px]" : "translate-x-0.5"
                                                    )}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {formValues[req.name] ? 'Yes' : 'No'}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
                            {triggerError && (
                                <div className="mb-3">
                                    <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl flex items-center gap-2">
                                        <span className="flex-1">{triggerError}</span>
                                        {lastRequestDetails && (
                                            <button
                                                onClick={() => setShowRequestDetails(!showRequestDetails)}
                                                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                title="View request details"
                                            >
                                                <IconInfoCircle size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {showRequestDetails && lastRequestDetails && (
                                        <div className="mt-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150 shadow-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-bold">{lastRequestDetails.method}</span>
                                                <span className="text-gray-500 dark:text-gray-400 truncate text-[10px]">{lastRequestDetails.webhookUrl}</span>
                                            </div>
                                            <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Body</span>
                                                <pre className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">{JSON.stringify(lastRequestDetails.body, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowInputModal(false)}
                                    disabled={isTriggering}
                                    className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFormSubmit}
                                    disabled={!isFormValid() || isTriggering}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all",
                                        isFormValid() && !isTriggering
                                            ? "bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5"
                                            : "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                                    )}
                                >
                                    {isTriggering ? (
                                        <>
                                            <IconLoader2 size={16} className="animate-spin" />
                                            Triggering...
                                        </>
                                    ) : (
                                        <>
                                            <IconPlayerPlay size={16} />
                                            Run Workflow
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
