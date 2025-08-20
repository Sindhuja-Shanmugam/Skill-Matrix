import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  X,
  Edit,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  User,
} from "lucide-react";
import { userService, assessmentService, skillService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { TeamMember, SkillModalData } from "../../../types/teamTypes";
import { 
  AssessmentWithHistory, 
  AssessmentStatus, 
  LeadSkillAssessment, 
  TeamStatistics,
  DetailedScore 
} from "../../../types/assessmentTypes";
import AllAssessmentsTab from "./page/AllAssessmentsTab";
import PendingActionsTab from "./page/PendingActionsTab";
import SkillScoresModal from "./modals/SkillScoresModal";
import OverdueDetailsModal from "./modals/OverdueDetailsModal";

import MyAssessmentReview from "../shared/myAssessmentReview";

interface Skill {
  id: number;
  name: string;
}
const TeamAssessment = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
    const [pendingAssessments, setPendingAssessments] = useState<AssessmentWithHistory[]>([]);
    const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("assessments");
    const [curLeadScore,setCurLeadScore]=useState<{ [skillId: number]: number }>({});
    const [openDropdowns, setOpenDropdowns] = useState<{
        [key: string]: boolean;
    }>({});
    const [userModalMode, setUserModalMode] = useState<"add" | "edit">("add");
    const [usertoDelete, setUserToDelete] = useState<TeamMember | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [skillModalData, setSkillModalData] = useState<SkillModalData | null>(null);

    // Assessment workflow states
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
    const [skillScores, setSkillScores] = useState<{ [skillId: number]: number }>({});
    const [previousApprovedScores, setPreviousApprovedScores] = useState<{ [skillId: number]: number }>({});
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedAssessmentHistory, setSelectedAssessmentHistory] = useState<AssessmentWithHistory | null>(null);
    
    //Skill description
    const [showSkillDescriptionModal, setShowSkillDescriptionModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    
    // Overdue assessment modal
    const [showOverdueModal, setShowOverdueModal] = useState(false);

    useEffect(() => {
        loadTeamData();
    }, [user]);

    const handleViewSkillDescription = (skill: Skill) => {
    setSelectedSkill(skill);
    setShowSkillDescriptionModal(true);
    };

    const closeSkillDescriptionModal = () => {
    setSelectedSkill(null);
    setShowSkillDescriptionModal(false);
    };


    const loadTeamData = async () => {
        console.log('loading...');
        setIsLoading(true);
        try {
            const [membersRes, assessmentsRes, pendingRes, statsRes, skillsRes] = await Promise.all([
                assessmentService.getTeamMembers().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getPendingTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessmentStatistics().catch(() => ({ success: false, data: null })),
                skillService.getAllSkills(),
            ]);

            if (membersRes.success && membersRes.data.length > 0) {
                setTeamMembers(membersRes.data);
            } else if (user?.Team?.name) {
                const fallbackData = await userService.getTeamMatrix(user.Team.name);
                setTeamMembers(fallbackData || []);
            }

            if (assessmentsRes.success) setAssessments(assessmentsRes.data);
            if (pendingRes.success) setPendingAssessments(pendingRes.data);
            if (statsRes.success) setStatistics(statsRes.data);
            if (skillsRes.success) setSkills(skillsRes.data);
        } catch (error) {
            console.error("Error loading team data:", error);
            toast({
                title: "Error",
                description: "Failed to load team data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(()=>{
        const isAnyModalOpen=showSkillModal || showUserModal || showDeleteModal;
        if(isAnyModalOpen){
            document.body.style.overflow="hidden";
            return()=>{
                document.body.style.overflow="unset";
            };
        }
    },[showSkillModal,showUserModal,showDeleteModal]);

    useEffect(() => {
        if (selectedTab !== "writeAssessment") {
            setSelectedAssessment(null);
            if (selectedTab === "pending" || selectedTab === "assessments") {
                loadTeamData();
            }
        }
    }, [selectedTab]);

    const getStatusColor = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.INITIATED:
                return "bg-blue-100 text-blue-800";
            case AssessmentStatus.LEAD_WRITING:
                return "bg-yellow-100 text-yellow-800";
            case AssessmentStatus.EMPLOYEE_REVIEW:
                return "bg-purple-100 text-purple-800";
            case AssessmentStatus.EMPLOYEE_APPROVED:
                return "bg-green-100 text-green-800";
            case AssessmentStatus.EMPLOYEE_REJECTED:
                return "bg-red-100 text-red-800";
            case AssessmentStatus.HR_FINAL_REVIEW:
                return "bg-indigo-100 text-indigo-800";
            case AssessmentStatus.COMPLETED:
                return "bg-gray-100 text-gray-800";
            case AssessmentStatus.CANCELLED:
                return "bg-gray-100 text-gray-500";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: AssessmentStatus) => {
        switch (status) {
            case AssessmentStatus.INITIATED:
                return <Clock className="h-4 w-4" />;
            case AssessmentStatus.LEAD_WRITING:
                return <Edit className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REVIEW:
                return <Eye className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_APPROVED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REJECTED:
                return <X className="h-4 w-4" />;
            case AssessmentStatus.HR_FINAL_REVIEW:
                return <AlertCircle className="h-4 w-4" />;
            case AssessmentStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.CANCELLED:
                return <X className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const handleWriteAssessment = async (assessment: AssessmentWithHistory) => {
        const userId = typeof assessment.user.id === "number" ? assessment.user.id : assessment.user.id;
        
        // Check if user has older pending assessments that should be completed first
        const canProceed = checkForOlderPendingAssessments(userId, assessment.user?.name || 'Unknown User', assessment);
        
        if (!canProceed) {
            return;
        }

        setSelectedAssessment(assessment);
        setSelectedTab("writeAssessment");
        console.log("current detailedScores", assessment.detailedScores);

        const initialScores: { [skillId: number]: number } = {};
        const previousScores: { [skillId: number]: number } = {};

        // First, use current assessment scores if they exist (for assessments already in progress)
        assessment.detailedScores?.forEach((score) => {
            if (score.score != null) {
                initialScores[score.skillId] = score.score;
                console.log(`Using existing score for skill ${score.skillId}: ${score.score}`);
            }
        });

        // Then, fetch latest approved scores from previous completed assessments
        try {
            const latestRes = await assessmentService.getUserLatestApprovedScoresByUserId(userId);

            if (latestRes.success && latestRes.data) {
                console.log("Latest approved scores from previous assessments:", latestRes.data);
                
                latestRes.data.forEach((latest) => {
                    const previousScore = latest.score ?? latest.lead_score ?? latest.self_score ?? 0;
                    previousScores[latest.skill_id] = previousScore;
                    
                    // Only use previous scores if current assessment doesn't have a score for this skill
                    if (initialScores[latest.skill_id] === undefined) {
                        initialScores[latest.skill_id] = previousScore;
                        console.log(`Using previous approved score for skill ${latest.skill_id}: ${previousScore}`);
                    }
                });
            } else {
                console.log("No previous approved scores found or API call failed");
            }
        } catch (error) {
            console.error("Error fetching previous approved scores:", error);
            toast({
                title: "Warning",
                description: "Could not load previous assessment scores. Starting with blank scores.",
                variant: "default"
            });
        }

        // Ensure all skills in current assessment have a score (default to 0 if no previous score)
        assessment.detailedScores?.forEach((score) => {
            if (initialScores[score.skillId] === undefined) {
                initialScores[score.skillId] = 0;
                console.log(`No previous score found for skill ${score.skillId}, defaulting to 0`);
            }
        });

        console.log("Final initial scores in TA:", initialScores);
        console.log("Previous approved scores in TA:", previousScores);

        setSkillScores(initialScores);
        setPreviousApprovedScores(previousScores);
        setComments("");
    };

    
    const handleSubmitAssessment = async () => {
        if (!selectedAssessment) return;

        const unscoredSkills = selectedAssessment.detailedScores.filter(
            (score) => !(skillScores[score.skillId] && skillScores[score.skillId] > 0)
        );

        if (unscoredSkills.length > 0) {
            toast({
            title: "Incomplete Scores",
            description: "Please provide scores for all skills before submitting.",
            variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const skillAssessments: LeadSkillAssessment[] = selectedAssessment.detailedScores.map((score: DetailedScore) => ({
                skillId: score.skillId,
                leadScore: skillScores[score.skillId] || 0,
            }));
            const payload={
                assessmentId:selectedAssessment.id,
                skills:skillAssessments,
                comments
            };
            console.log("Submitting payload:",payload);

            const response = await assessmentService.writeLeadAssessment(                
                selectedAssessment.id,
                skillAssessments,
                comments
            );

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Assessment submitted successfully. You can now access newer assessments.",
                });
                
                // Refresh data and return to pending tab
                await loadTeamData(); // Refresh data
                setSelectedTab("pending");
                setSelectedAssessment(null);
            }
        } catch (error) {
            console.error("Error submitting assessment:", error);
            toast({
                title: "Error",
                description: "Failed to submit assessment",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewHistory = (assessment: AssessmentWithHistory) => {
        // Navigate to dedicated assessment details page
        navigate(`/assessment-details/${assessment.id}`);
    };

    const handleViewUserHistory = (userId: string, userName: string) => {
        // Navigate to dedicated user assessment history page
        navigate(`/assessment-history/${userId}/${encodeURIComponent(userName)}`);
    };

    // Handler for showing overdue details modal
    const handleShowOverdueDetails = (overdueAssessments: AssessmentWithHistory[]) => {
        setShowOverdueModal(true);
    };

    // Check if user has older pending assessments that should be completed first
    const checkForOlderPendingAssessments = (userId: string, userName: string, currentAssessment: AssessmentWithHistory) => {
        try {
            // Get all pending assessments for this user
            const userPendingAssessments = assessments.filter(assessment => 
                assessment.userId === userId && 
                !['COMPLETED', 'CANCELLED'].includes(assessment.status)
            );

            // Find assessments that are older than the current one (lower ID = older)
            const olderPendingAssessments = userPendingAssessments.filter(assessment => 
                assessment.id < currentAssessment.id
            );

            if (olderPendingAssessments.length > 0) {
                // Sort by ID to get the oldest first
                const oldestAssessment = olderPendingAssessments.sort((a, b) => a.id - b.id)[0];
                
                toast({
                    title: "Complete Previous Assessments First",
                    description: `Please complete Assessment #${oldestAssessment.id} before accessing Assessment #${currentAssessment.id}. Complete assessments in chronological order.`,
                    variant: "destructive"
                });
                return false;
            }
            
            return true; // Allow access to this assessment
        } catch (error) {
            console.error('Error checking for older pending assessments:', error);
            toast({
                title: "Error",
                description: "Failed to check assessment order",
                variant: "destructive"
            });
            return false;
        }
    };



    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const tabs = [
        { id: "my-assessments", label: "My Assessments", icon: User },
        { id: "assessments", label: "All Assessments", icon: FileText },
        { id: "pending", label: "Pending Actions", icon: Clock },
    ];

    if(user?.leadId === null) tabs.shift();

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Members</p>
                            <p className="text-2xl font-bold">{statistics?.totalTeamMembers || teamMembers.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">
                                {statistics?.assessments.byStatus.completed || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-sm text-gray-600">Pending Actions</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {statistics?.pendingActions || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Recent Activity</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {statistics?.recentAssessments || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {tabs
                        .map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        selectedTab === tab.id
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                    {tab.id === "pending" && statistics?.pendingActions > 0 && (
                                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {statistics.pendingActions}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Tab Content */}
                    {selectedTab === "my-assessments" && (
                        <MyAssessmentReview />
                    )}
                    {selectedTab === "assessments" && (
                        <AllAssessmentsTab 
                            assessments={assessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                            userRole={user?.role?.name}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onShowOverdueDetails={handleShowOverdueDetails}
                        />
                    )}

                    {selectedTab === "pending" && (
                        <PendingActionsTab 
                            pendingAssessments={pendingAssessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                        />
                    )}

                    {/* Overdue Details Modal */}
                    <OverdueDetailsModal
                        isOpen={showOverdueModal}
                        onClose={() => setShowOverdueModal(false)}
                        overdueAssessments={assessments.filter(assessment => {
                            if (!assessment?.deadlineDate) return false;
                            const deadline = new Date(assessment.deadlineDate);
                            const now = new Date();
                            return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
                        })}
                        formatDate={formatDate}
                        onViewAssessment={handleWriteAssessment}
                    />
                    
                </div>
            </div>
        </div>
    );
}

// Tab Components

export default TeamAssessment;
