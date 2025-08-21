import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { assessmentService, skillService, userService, teamService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  AssessmentCycle,
} from "@/types/assessmentTypes";

import { UserHistoryTab } from "./modals/userHistoryModel";
import { ScoreHistoryModal } from "./modals/scoreHistoryModel";
import { HRReviewModal } from "./modals/hrReviewModel";
import { BulkAssessmentModal } from "./modals/bulkAssessmentModel";
import { OverdueDetailsModal } from "./modals/overdueDetailsModal";
//import { InitiateAssessmentModal } from "./initiateAssessmentModel";
import { PendingReviewsTab } from "./page/pendingReviewsTab";
import { CyclesTab } from "./page/cyclesTab";
import { OverviewTab } from "./page/overviewTab";
import { useNavigate } from "react-router-dom";
interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
}

interface Team {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const HRAssessmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<AssessmentWithHistory[]>([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [showScoreHistoryModal, setShowScoreHistoryModal] = useState(false);
  const [showOverdueDetailsModal, setShowOverdueDetailsModal] = useState(false);
  const [overdueAssessments, setOverdueAssessments] = useState<any[]>([]);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection states
  const [selectedAssessments, setSelectedAssessments] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [bulkComments, setBulkComments] = useState("");

  // Form states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduleType, setScheduleType] = useState("QUARTERLY");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [comments, setComments] = useState("");

  // Bulk assessment states
  const [bulkTitle, setBulkTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);
  const [bulkScheduleType, setBulkScheduleType] = useState("QUARTERLY");
  const [bulkDeadlineDate, setBulkDeadlineDate] = useState("");

  // Helper function to get default deadline date (7 days from now)
  const getDefaultDeadlineDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  useEffect(() => {
    if (user?.role?.name === "hr") {
      loadHRData();
      // Set default deadline dates
      if (!deadlineDate) setDeadlineDate(getDefaultDeadlineDate());
      if (!bulkDeadlineDate) setBulkDeadlineDate(getDefaultDeadlineDate());
    }
  }, [user]);

  const loadHRData = async () => {
    setIsLoading(true);
    try {
      const [assessmentsRes, userSummariesRes, cyclesRes, usersRes, teamsRes, skillsRes] = await Promise.all([
        assessmentService.getAssessmentsForRole(),
        assessmentService.getUserAssessmentSummaries(),
        assessmentService.getAssessmentCycles(),
        userService.getAllUsers(),
        teamService.getAllTeams(),
        skillService.getAllSkills(),
      ]);

      if (assessmentsRes?.success !== false) setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes?.data || []);
      if (userSummariesRes?.success !== false) setUserSummaries(Array.isArray(userSummariesRes) ? userSummariesRes : userSummariesRes?.data || []);
      if (cyclesRes?.success !== false) setCycles(Array.isArray(cyclesRes) ? cyclesRes : cyclesRes?.data || []);
      if (usersRes?.success !== false) {
        // Filter out HR users
        const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
        console.log("Users data:", usersData); // Debug log
        const nonHRUsers = usersData.filter((u: User) => u.role?.name !== "hr");
        setUsers(nonHRUsers);
      }
      if (teamsRes?.success !== false) setTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes?.data || []);
      if (skillsRes?.success !== false) setSkills(Array.isArray(skillsRes) ? skillsRes : skillsRes?.data || []);
    } catch (error) {
      console.error("Error loading HR data:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleInitiateAssessment = async () => {
    if (!selectedUser || selectedSkills.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and at least one skill",
        variant: "destructive",
      });
      return;
    }

    if (!deadlineDate) {
      toast({
        title: "Error",
        description: "Please select a deadline date",
        variant: "destructive",
      });
      return;
    }

    const deadline = new Date(deadlineDate);
    const now = new Date();
    if (deadline <= now) {
      toast({
        title: "Error",
        description: "Deadline must be in the future",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate deadline days from now
      const deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await assessmentService.initiateAssessment({
        targetUserId: selectedUser,
        skillIds: selectedSkills,
        scheduledDate: scheduledDate || undefined,
        scheduleType,
        deadlineDays,
        comments,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Assessment initiated successfully",
        });
        setShowInitiateModal(false);
        resetForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInitiate = async () => {
    if (!bulkTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title",
        variant: "destructive",
      });
      return;
    }

    if (!bulkDeadlineDate) {
      toast({
        title: "Error",
        description: "Please select a deadline date",
        variant: "destructive",
      });
      return;
    }

    const deadline = new Date(bulkDeadlineDate);
    const now = new Date();
    if (deadline <= now) {
      toast({
        title: "Error",
        description: "Deadline must be in the future",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate deadline days from now
      const deadlineDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await assessmentService.initiateBulkAssessment({
        assessmentTitle: bulkTitle,
        includeTeams: selectedTeams.length > 0 ? selectedTeams : ["all"],
        scheduledDate: scheduledDate || undefined,
        scheduleType: bulkScheduleType,
        deadlineDays,
        comments,
        excludeUsers: excludedUsers,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Initiate assessment initiated for ${response.data.totalAssessments} users`,
        });
        setShowBulkModal(false);
        resetBulkForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRReview = async (approved: boolean) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrFinalReview(
        selectedAssessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting HR review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssessments(new Set());
      setSelectAll(false);
    } else {
      const pendingHRReviews = assessments.filter(a => 
        a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
        a.status === AssessmentStatus.HR_FINAL_REVIEW
      );
      const allIds = new Set(pendingHRReviews.map(assessment => assessment.id));
      setSelectedAssessments(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectAssessment = (assessmentId: number) => {
    const newSelected = new Set(selectedAssessments);
    if (newSelected.has(assessmentId)) {
      newSelected.delete(assessmentId);
    } else {
      newSelected.add(assessmentId);
    }
    setSelectedAssessments(newSelected);
    
    const pendingHRReviews = assessments.filter(a => 
      a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
      a.status === AssessmentStatus.HR_FINAL_REVIEW
    );
    setSelectAll(newSelected.size === pendingHRReviews.length);
  };

  const handleBulkReview = async () => {
    if (selectedAssessments.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one assessment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrBulkFinalReview({
        assessmentIds: Array.from(selectedAssessments),
        approved: bulkAction === 'approve',
        comments: bulkComments
      });

      if (response.success || response.successful !== undefined) {
        const result = response.data || response;
        toast({
          title: "Bulk Review Completed",
          description: `${result.successful} assessments processed successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        setShowBulkReviewModal(false);
        setSelectedAssessments(new Set());
        setSelectAll(false);
        setBulkComments("");
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting bulk review:", error);
      toast({
        title: "Error",
        description: "Failed to submit bulk review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowScoreHistory = async (assessmentId: number) => {
    try {
      const response = await assessmentService.getAssessmentScoreHistory(assessmentId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setScoreHistory(historyData);
        setShowScoreHistoryModal(true);
      } else {
        throw new Error(response?.error || "Failed to load score history");
      }
    } catch (error) {
      console.error("Error loading score history:", error);
      toast({
        title: "Error",
        description: "Failed to load score change history",
        variant: "destructive",
      });
    }
  };

  const handleShowOverdueDetails = (assessments: any[]) => {
    // Convert assessments to the format expected by the modal
    const overdueData = assessments.map(assessment => ({
      user: assessment.user,
      latestAssessment: assessment
    }));
    setOverdueAssessments(overdueData);
    setShowOverdueDetailsModal(true);
  };

  const handleShowUserHistory = async (userId: string, userName: string) => {
    try {
      setSelectedUserName(userName);
      setIsLoading(true);
      const response = await assessmentService.getUserAssessmentHistory(userId);
      if (response?.success !== false) {
        const historyData = Array.isArray(response) ? response : response?.data || [];
        setSelectedUserHistory(historyData);
        setShowHistoryModal(true);
        setSelectedTab("history");
      }
    } catch (error) {
      console.error("Error loading user history:", error);
      toast({
        title: "Error",
        description: "Failed to load user assessment history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedSkills([]);
    setScheduledDate("");
    setScheduleType("QUARTERLY");
    setDeadlineDate(getDefaultDeadlineDate());
    setComments("");
  };

  const resetBulkForm = () => {
    setBulkTitle("");
    setSelectedTeams([]);
    setSelectedSkills([]);
    setExcludedUsers([]);
    setScheduledDate("");
    setBulkScheduleType("QUARTERLY");
    setBulkDeadlineDate(getDefaultDeadlineDate());
    setComments("");
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

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingHRReviews = assessments.filter(a => 
    a.status === AssessmentStatus.EMPLOYEE_APPROVED || 
    a.status === AssessmentStatus.HR_FINAL_REVIEW
  );

  // Helper function to check if assessment is overdue
  const isOverdue = (assessment: AssessmentWithHistory) => {
    if (!assessment?.deadlineDate) return false;
    const deadline = new Date(assessment.deadlineDate);
    const now = new Date();
    return deadline < now && !['COMPLETED', 'CANCELLED'].includes(assessment.status);
  };

  const currentOverdueAssessments = assessments.filter(assessment => isOverdue(assessment));

  const statistics = {
    total: assessments.length,
    pending: assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length,
    completed: assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
    hrReviews: pendingHRReviews.length,
    overdue: currentOverdueAssessments.length,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    // { id: "assessments", label: "All Assessments", icon: FileText },
    { id: "cycles", label: "Assessment Cycles", icon: Calendar },
    { id: "pending-reviews", label: "HR Reviews", icon: AlertCircle, count: pendingHRReviews.length },
    { id: "history", label: "History", hidden:true},
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Assessment Management</h1>
        </div>
        <div className="mb-5 flex gap-3">
          {/* <button
            onClick={() => {
              if (users.length === 0 || skills.length === 0) {
                toast({
                  title: "Error",
                  description: "Please wait for data to load before initiating assessment",
                  variant: "destructive",
                });
                return;
              }
              setShowInitiateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Initiate Assessment
          </button> */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Initiate Assessment
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Pending HR Review</p>
              <p className="text-2xl font-bold text-red-600">{statistics.hrReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => statistics.overdue > 0 && handleShowOverdueDetails(currentOverdueAssessments)}>
          <div className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-700" />
            <div>
              <p className="text-sm text-gray-600">Overdue Assessments</p>
              <p className="text-2xl font-bold text-red-700">{statistics.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-5 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs
            .filter(tab => !tab.hidden)
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
                  {Icon && <Icon className="h-4 w-4" />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content will be added here */}
          {selectedTab === "overview" && (
            <OverviewTab assessments={assessments} cycles={cycles} statistics={statistics} />
          )}
          
          {/* {selectedTab === "assessments" && (
            <AssessmentsTab
              userSummaries={userSummaries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              onShowHistory={handleShowUserHistory}
              onShowOverdueDetails={() => handleShowOverdueDetails(currentOverdueAssessments)}
            />
          )} */}

          {selectedTab === "cycles" && (
            <CyclesTab cycles={cycles} formatDate={formatDate} userSummaries={userSummaries}/>
          )}

          {selectedTab === "pending-reviews" && (
            <PendingReviewsTab
              pendingReviews={pendingHRReviews}
              onReview={(assessment) => {
                setSelectedAssessment(assessment);
                setReviewComments("");
                setShowReviewModal(true);
              }}
              onShowHistory={handleShowUserHistory}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              selectedAssessments={selectedAssessments}
              selectAll={selectAll}
              onSelectAll={handleSelectAll}
              onSelectAssessment={handleSelectAssessment}
              onBulkAction={(action) => {
                setBulkAction(action);
                setShowBulkReviewModal(true);
              }}
            />
          )}
          {selectedTab==="history" && showHistoryModal && (
            <UserHistoryTab
              userName={selectedUserName}
              assessmentHistory={selectedUserHistory}
              onBack={() => setShowHistoryModal(false)} // Go back to previous page
              onShowScoreHistory={handleShowScoreHistory}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          )}

          {showScoreHistoryModal && (
            <ScoreHistoryModal
              scoreHistory={scoreHistory}
              isOpen={showScoreHistoryModal}
              onClose={() => {
                setShowScoreHistoryModal(false);
                setScoreHistory([]);
              }}
              formatDate={formatDate}
            />
          )}

          {showOverdueDetailsModal && (
            <OverdueDetailsModal
              overdueAssessments={overdueAssessments}
              formatDate={formatDate}
              onClose={() => {
                setShowOverdueDetailsModal(false);
                setOverdueAssessments([]);
              }}
            />
          )}

        </div>

      </div>

      {/* Modals */}
      {/* {showInitiateModal && users.length > 0 && skills.length > 0 && (
        <InitiateAssessmentModal
          users={users}
          skills={skills}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={scheduleType}
          setScheduleType={setScheduleType}
          deadlineDays={deadlineDays}
          setDeadlineDays={setDeadlineDays}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleInitiateAssessment}
          onClose={() => setShowInitiateModal(false)}
        />
      )} */}

      {showBulkModal && (
        <BulkAssessmentModal
          teams={teams}
          users={users}
          bulkTitle={bulkTitle}
          setBulkTitle={setBulkTitle}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          excludedUsers={excludedUsers}
          setExcludedUsers={setExcludedUsers}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduleType={bulkScheduleType}
          setScheduleType={setBulkScheduleType}
          deadlineDate={bulkDeadlineDate}
          setDeadlineDate={setBulkDeadlineDate}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkInitiate}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {showReviewModal && selectedAssessment && (
        <HRReviewModal
          assessment={selectedAssessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleHRReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {showBulkReviewModal && (
        <BulkReviewModal
          selectedCount={selectedAssessments.size}
          action={bulkAction}
          comments={bulkComments}
          setComments={setBulkComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkReview}
          onClose={() => setShowBulkReviewModal(false)}
        />
      )}

          </div>
  );
};

const BulkReviewModal: React.FC<{
  selectedCount: number;
  action: 'approve' | 'reject';
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}> = ({ selectedCount, action, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {action === 'approve' ? 'Accept' : 'Reject'} {selectedCount} Assessment{selectedCount > 1 ? 's' : ''}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Are you sure you want to {action === 'approve' ? 'accept' : 'reject'} {selectedCount} selected assessment{selectedCount > 1 ? 's' : ''}?
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments {action === 'reject' ? '(Required for rejection)' : '(Optional)'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={`Add comments for this ${action === 'approve' ? 'approval' : 'rejection'}...`}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required={action === 'reject'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || (action === 'reject' && !comments.trim())}
            className={`px-4 py-2 text-white rounded-md disabled:opacity-50 flex items-center gap-2 ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {action === 'approve' ? 'Accept All' : 'Reject All'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRAssessmentManagement;
