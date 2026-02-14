"use client";

import { useState, useEffect } from 'react';
import { Onboarding, fetchOnboardings } from '@/lib/supabase';
import { User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
    const [candidates, setCandidates] = useState<Onboarding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCandidates();
    }, []);

    const loadCandidates = async () => {
        setLoading(true);
        const data = await fetchOnboardings();
        setCandidates(data);
        setLoading(false);
    };

    // Filter candidates based on stage numbers
    const interviewStage = candidates.filter(c => c.interview_stage === 1 || c.interview_stage === 2);
    const techAssessmentStage = candidates.filter(c => c.interview_stage === 3 || c.interview_stage === 4);
    const onboardedStage = candidates.filter(c => c.interview_stage >= 5);

    const removeCandidate = (id: string) => {
        setCandidates(prev => prev.filter(c => c.id !== id));
    };

    const getStageLabel = (stage: number) => {
        switch (stage) {
            case 1: return 'HR Screening';
            case 2: return 'Manager Interview';
            case 3: return 'Take-home Assignment';
            case 4: return 'Technical Review';
            case 5: return 'Onboarding Completed';
            default: return `Stage ${stage}`;
        }
    };

    const CandidateCard = ({ candidate, onRemove }: { candidate: Onboarding; onRemove: (id: string) => void }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3 relative group">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {(candidate.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">{candidate.name}</h4>
                        <p className="text-xs text-gray-500">{candidate.email || 'No email'}</p>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(candidate.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove candidate"
                >
                    <XCircle size={16} />
                </button>
            </div>

            <div className="space-y-2 mt-3">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                        {getStageLabel(candidate.interview_stage)}
                    </span>
                </div>

                {/* Footer Info */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(candidate.created_at).toLocaleDateString()}</span>
                    {candidate.passed ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle size={12} /> Passed
                        </span>
                    ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Clock size={12} /> Pending
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Onboarding Board</h1>
                    <p className="text-gray-500">Track candidate progress from interview to onboarding</p>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">

                    {/* Column 1: Interview Stage */}
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                Interview Stage
                            </h3>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {interviewStage.length}
                            </span>
                        </div>
                        <div className="bg-gray-100/50 rounded-2xl p-4 flex-1 border border-gray-200/50 overflow-y-auto">
                            {loading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                            ) : interviewStage.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-sm">No candidates in interview</p>
                                </div>
                            ) : (
                                interviewStage.map(c => <CandidateCard key={c.id} candidate={c} onRemove={removeCandidate} />)
                            )}
                        </div>
                    </div>

                    {/* Column 2: Technical Assessment */}
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Technical Assessment
                            </h3>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {techAssessmentStage.length}
                            </span>
                        </div>
                        <div className="bg-gray-100/50 rounded-2xl p-4 flex-1 border border-gray-200/50 overflow-y-auto">
                            {loading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                            ) : techAssessmentStage.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-sm">No candidates in assessment</p>
                                </div>
                            ) : (
                                techAssessmentStage.map(c => <CandidateCard key={c.id} candidate={c} onRemove={removeCandidate} />)
                            )}
                        </div>
                    </div>

                    {/* Column 3: Overall Result */}
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                Onboarded
                            </h3>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {onboardedStage.length}
                            </span>
                        </div>
                        <div className="bg-gray-100/50 rounded-2xl p-4 flex-1 border border-gray-200/50 overflow-y-auto">
                            {loading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                            ) : onboardedStage.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-sm">No onboarded candidates</p>
                                </div>
                            ) : (
                                onboardedStage.map(c => <CandidateCard key={c.id} candidate={c} onRemove={removeCandidate} />)
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
