
import { IconX, IconTrash, IconPencil, IconPlayerPlay, IconArrowRight, IconTable, IconRobot, IconDatabase, IconCheck, IconLoader2, IconBrain, IconAi, IconSettings, IconCode, IconFileTextFilled, IconFileTextAi, IconMessageDots, IconTerminal, IconCopy, IconJson, IconChevronDown, IconEdit } from '@tabler/icons-react';
import { Workflow } from '@/hooks/use-workflows';
import { formatTimeAgo } from '@/lib/utils';
import { Fragment, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
            }, 800); // Reveal each step every 800ms
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

    if (!isOpen || !workflow) return null;

    const executionPlan = workflow.executionPlan || [];

    return (
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
                                            "transition-all duration-500 ease-out transform",
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
                            {/* 1. Open Agent / Run Workflow */}
                            {/* 1. Run Workflow (Always visible, LHS) */}
                            <button
                                onClick={() => onRun && onRun(workflow)}
                                className="flex-1 flex items-center justify-center px-4 py-3.5 text-sm font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <IconPlayerPlay className="w-5 h-5 mr-2" />
                                Run
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
    );
}
