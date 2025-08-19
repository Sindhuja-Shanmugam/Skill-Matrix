import React from "react";
import { X, AlertTriangle, Calendar, Clock, User, FileText } from "lucide-react";
import { AssessmentWithHistory } from "../../../../types/assessmentTypes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  overdueAssessments: AssessmentWithHistory[];
  formatDate: (date: string | Date) => string;
  onViewAssessment?: (assessment: AssessmentWithHistory) => void;
}

const OverdueDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  overdueAssessments,
  formatDate,
  onViewAssessment
}) => {
  if (!isOpen) return null;

  // Helper function to calculate days overdue
  const getDaysOverdue = (deadlineDate: string | Date) => {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diffTime = now.getTime() - deadline.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get severity color based on days overdue
  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue >= 8) {
      return "bg-red-900 text-white border-red-900"; // Dark red for severely overdue
    } else if (daysOverdue >= 4) {
      return "bg-red-600 text-white border-red-600"; // Red for overdue
    } else {
      return "bg-orange-500 text-white border-orange-500"; // Orange for recently overdue
    }
  };

  // Helper function to get severity label
  const getSeverityLabel = (daysOverdue: number) => {
    if (daysOverdue >= 8) {
      return "SEVERELY OVERDUE";
    } else if (daysOverdue >= 4) {
      return "OVERDUE";
    } else {
      return "RECENTLY OVERDUE";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-800">
                Overdue Team Assessments
              </h2>
              <p className="text-sm text-red-600">
                {overdueAssessments.length} assessment{overdueAssessments.length !== 1 ? 's' : ''} past deadline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {overdueAssessments.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No overdue assessments</p>
              <p className="text-sm text-gray-500">
                All team assessments are on track!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueAssessments.map((assessment) => {
                const daysOverdue = getDaysOverdue(assessment.deadlineDate!);
                const severityColor = getSeverityColor(daysOverdue);
                const severityLabel = getSeverityLabel(daysOverdue);

                return (
                  <div
                    key={assessment.id}
                    className={`rounded-lg border p-4 ${
                      daysOverdue >= 8
                        ? 'bg-red-900/5 border-red-900/20'
                        : daysOverdue >= 4
                        ? 'bg-red-600/5 border-red-600/20'
                        : 'bg-orange-500/5 border-orange-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {assessment.user?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {assessment.user?.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Assessment #{assessment.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColor}`}>
                          {severityLabel}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline: {formatDate(assessment.deadlineDate!)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>Status: {assessment.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Role: {assessment.user?.Role?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {assessment.user?.Team?.name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span className="font-medium">Team:</span>
                        <span>{assessment.user.Team.name}</span>
                      </div>
                    )}

                    {assessment.currentCycle && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span className="font-medium">Cycle:</span>
                        <span>Assessment Cycle #{assessment.currentCycle}</span>
                      </div>
                    )}

                    {onViewAssessment && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => onViewAssessment(assessment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Assessment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Priority:</span> Focus on severely overdue assessments first
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverdueDetailsModal;