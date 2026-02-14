"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { LiveLog, LiveStatusStep } from "@/components/LiveWorkflowStatus";
import { useWorkflows } from "@/hooks/use-workflows";
import { useRouter, usePathname } from "next/navigation";

const STEP_MIN_DISPLAY_MS: Partial<Record<LiveStatusStep, number>> = {
    guard_passed: 1200,
    screenshot: 1400,
    executed: 1800,
};

interface LiveStatusContextType {
    liveLogs: LiveLog[];
    currentStep: LiveStatusStep | null;
    generationResult: any | null;
    isGenerating: boolean;
    isOpen: boolean;
    isCollapsed: boolean;
    generateAgent: (prompt: string) => Promise<void>;
    closeLiveStatus: () => void;
    toggleCollapse: () => void;
    setCollapsed: (collapsed: boolean) => void;
    expand: () => void;
}

const LiveStatusContext = createContext<LiveStatusContextType | undefined>(undefined);

export function LiveStatusProvider({ children }: { children: React.ReactNode }) {
    const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
    const [currentStep, setCurrentStep] = useState<LiveStatusStep | null>(null);
    const [generationResult, setGenerationResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);
    const activeSessionRef = useRef(0);
    const stepQueueRef = useRef<Promise<void>>(Promise.resolve());
    const stepDisplayStateRef = useRef<{ lastStep: LiveStatusStep | null; lastStepAt: number }>({
        lastStep: null,
        lastStepAt: 0,
    });

    const { generate } = useWorkflows();
    const router = useRouter();
    const pathname = usePathname();
    const isInitialPathRef = useRef(true);

    const enqueueStepTransition = useCallback((sessionId: number, status: LiveStatusStep, resultData?: any) => {
        const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        stepQueueRef.current = stepQueueRef.current
            .then(async () => {
                if (sessionId !== activeSessionRef.current) return;

                const previousStep = stepDisplayStateRef.current.lastStep;
                if (previousStep) {
                    const minVisibleMs = STEP_MIN_DISPLAY_MS[previousStep] ?? 0;
                    if (minVisibleMs > 0) {
                        const elapsed = Date.now() - stepDisplayStateRef.current.lastStepAt;
                        const remaining = minVisibleMs - elapsed;
                        if (remaining > 0) {
                            await wait(remaining);
                            if (sessionId !== activeSessionRef.current) return;
                        }
                    }
                }

                setCurrentStep(status);
                stepDisplayStateRef.current = { lastStep: status, lastStepAt: Date.now() };

                if (status === 'executed' && resultData) {
                    const executedVisibleMs = STEP_MIN_DISPLAY_MS.executed ?? 0;
                    if (executedVisibleMs > 0) {
                        await wait(executedVisibleMs);
                        if (sessionId !== activeSessionRef.current) return;
                    }
                    setGenerationResult(resultData);
                    setIsGenerating(false);
                }
            })
            .catch((error) => {
                console.error("Step transition queue error", error);
            });
    }, []);

    const enqueueCompletionTransition = useCallback((sessionId: number, completionMessage?: string) => {
        const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        stepQueueRef.current = stepQueueRef.current
            .then(async () => {
                if (sessionId !== activeSessionRef.current) return;

                const previousStep = stepDisplayStateRef.current.lastStep;
                if (previousStep) {
                    const minVisibleMs = STEP_MIN_DISPLAY_MS[previousStep] ?? 0;
                    if (minVisibleMs > 0) {
                        const elapsed = Date.now() - stepDisplayStateRef.current.lastStepAt;
                        const remaining = minVisibleMs - elapsed;
                        if (remaining > 0) {
                            await wait(remaining);
                            if (sessionId !== activeSessionRef.current) return;
                        }
                    }
                }

                if (stepDisplayStateRef.current.lastStep !== 'executed') {
                    setCurrentStep('executed');
                    stepDisplayStateRef.current = { lastStep: 'executed', lastStepAt: Date.now() };

                    const executedVisibleMs = STEP_MIN_DISPLAY_MS.executed ?? 0;
                    if (executedVisibleMs > 0) {
                        await wait(executedVisibleMs);
                        if (sessionId !== activeSessionRef.current) return;
                    }
                }

                setGenerationResult((prev) => prev ?? {
                    completed: true,
                    success: false,
                    message: completionMessage || "Workflow generation process finished.",
                });
                setIsGenerating(false);
            })
            .catch((error) => {
                console.error("Completion transition queue error", error);
            });
    }, []);

    const connectWebSocket = useCallback((clientId: string, sessionId: number) => {
        // Determine WS URL (assume localhost:8000 for now, or use logic to match API_URL)
        const wsUrl = `ws://127.0.0.1:8000/ws/${clientId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
            setLiveLogs(prev => [...prev, { type: 'log', data: 'Connected to server...', timestamp: Date.now() }]);
        };

        ws.onmessage = (event) => {
            try {
                if (sessionId !== activeSessionRef.current) return;
                const message = JSON.parse(event.data);
                setLiveLogs(prev => [...prev, { ...message, timestamp: Date.now() }]);

                if (message.type === 'step') {
                    enqueueStepTransition(sessionId, message.status, message.data?.result);
                } else if (message.type === 'log') {
                    // Just logging
                } else if (message.type === 'complete') {
                    enqueueCompletionTransition(sessionId, typeof message.data === "string" ? message.data : undefined);
                }
            } catch (e) {
                console.error("Error parsing WS message", e);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        webSocketRef.current = ws;
    }, [enqueueStepTransition, enqueueCompletionTransition]);

    const generateAgent = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        // Reset state
        activeSessionRef.current += 1;
        const sessionId = activeSessionRef.current;
        stepQueueRef.current = Promise.resolve();
        stepDisplayStateRef.current = { lastStep: null, lastStepAt: Date.now() };
        setIsGenerating(true);
        setLiveLogs([]);
        setCurrentStep(null); // Will be set by WebSocket (guard_passed first)
        setGenerationResult(null);
        setIsOpen(true); // Open the modal immediately
        setIsCollapsed(false); // Ensure it starts expanded

        const clientId = crypto.randomUUID();
        connectWebSocket(clientId, sessionId);

        try {
            await generate(prompt, clientId);
        } catch (e) {
            console.error(e);
            setLiveLogs(prev => [...prev, { type: 'log', data: `Error: ${e}`, timestamp: Date.now() }]);
            setIsGenerating(false);
        }
    }, [generate, connectWebSocket]);

    const closeLiveStatus = useCallback(() => {
        activeSessionRef.current += 1;
        stepQueueRef.current = Promise.resolve();
        stepDisplayStateRef.current = { lastStep: null, lastStepAt: 0 };
        setIsOpen(false);
        setIsGenerating(false);
        if (webSocketRef.current) {
            webSocketRef.current.close();
        }
        // Redirect if successful
        if (generationResult) {
            router.push("/");
        }
    }, [generationResult, router]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const setCollapsed = useCallback((collapsed: boolean) => {
        setIsCollapsed(collapsed);
    }, []);

    const expand = useCallback(() => {
        setIsCollapsed(false);
    }, []);

    // When user navigates to another tab while agent is working, minimize to small card
    useEffect(() => {
        if (isInitialPathRef.current) {
            isInitialPathRef.current = false;
            return;
        }
        if (isOpen && !isCollapsed) {
            setIsCollapsed(true);
        }
    }, [pathname]);

    // Clean up WS on unmount
    useEffect(() => {
        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
        };
    }, []);

    return (
        <LiveStatusContext.Provider value={{
            liveLogs,
            currentStep,
            generationResult,
            isGenerating,
            isOpen,
            isCollapsed,
            generateAgent,
            closeLiveStatus,
            toggleCollapse,
            setCollapsed,
            expand
        }}>
            {children}
        </LiveStatusContext.Provider>
    );
}

export function useLiveStatus() {
    const context = useContext(LiveStatusContext);
    if (context === undefined) {
        throw new Error("useLiveStatus must be used within a LiveStatusProvider");
    }
    return context;
}
