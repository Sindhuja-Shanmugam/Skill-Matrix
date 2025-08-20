import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  User,
  Calendar,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Users,
} from "lucide-react";
import { assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
} from "@/types/assessmentTypes";
import {
  determineAssessmentContext,
  getUserHierarchyLevel,
  getAssessmentContextLabels,
  getWorkflowTransitions
} from "@/utils/assessmentUtils";


const MyAssessmentReview: React.FC = () => {
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AssessmentWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, [user]);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const [allAssessments, requiresAction] = await Promise.all([
        assessmentService.getUserAssessmentHistory(user?.id),
        assessmentService.getAssessmentsRequiringAction(),
      ]);

      if (allAssessments.success) {
        setAssessments(allAssessments.data);
      }
      if (requiresAction.success) {
        setPendingReviews(requiresAction);
      }
    } catch (error) {
      console.error("Error loading assessments:", error);
      toast({
        title: "Error",
        description: "Failed to load assessments",
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

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return <Clock className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING:
        return <Edit3 className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return <Eye className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return <ThumbsUp className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return <ThumbsDown className="h-4 w-4" />;
      case AssessmentStatus.HR_FINAL_REVIEW:
        return <AlertCircle className="h-4 w-4" />;
      case AssessmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  // Get context-specific labels and descriptions using utility function
  const label = {
      title: "My Assessments",
      description: "Review and manage your skill assessments",
      pendingTitle: "Action Required",
      pendingDescription: "The following assessments require your review",
      reviewInstructions: [
        `• Review the skill ratings provided by your Lead`,
        "• If you agree with the assessment, click \"Approve\"",
        "• If you disagree, click \"Request Changes\" with your feedback",
        "• Your decision will be sent to HR for final review"
      ]
    }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            {label.title}
          </h1>
          <p className="text-gray-600">{label.description}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{assessments.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-purple-600">{pendingReviews.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              {label.pendingTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {label.pendingDescription}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {pendingReviews.map((assessment) => (
              <div key={assessment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assessment.cycle?.title}</h4>
                      <p className="text-sm text-gray-500">Cycle {assessment.currentCycle}</p>
                    </div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    REVIEW REQUIRED
                  </span>
                </div>

                <div className="mb-4 p-3 bg-white rounded-md border">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Assessment completed by your Lead</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Skills assessed: {assessment.detailedScores?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted: {formatDate(assessment.requestedAt)}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/assessment-details/${assessment.id}`)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Review Assessment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Assessments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All My Assessments
          </h2>
        </div>

        <div className="p-6">
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No assessments found</p>
              <p className="text-sm text-gray-500">Your assessments will appear here once they are initiated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{assessment.cycle?.title}</h4>
                        {/* <p className="text-sm text-gray-500">Cycle {assessment.currentCycle}</p> */}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {getStatusIcon(assessment.status)}
                        <span className="ml-1">{assessment.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Created: {formatDate(assessment.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Scheduled: {formatDate(assessment.scheduledDate || assessment.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>Skills: {assessment.detailedScores?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {assessment.status === AssessmentStatus.EMPLOYEE_REVIEW && (
                        <span className="text-yellow-600 font-medium">⏳ Awaiting your review</span>
                      )}
                      {assessment.status === AssessmentStatus.COMPLETED && (
                        <span className="text-green-600 font-medium">✅ Assessment completed</span>
                      )}
                      {assessment.status === AssessmentStatus.EMPLOYEE_REJECTED && (
                        <span className="text-red-600 font-medium">🔄 Sent back for revision</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/assessment-details/${assessment.id}`)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Review Assessment
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssessmentReview;