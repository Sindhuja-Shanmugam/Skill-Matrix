// src/components/assessment/AssessmentForm.tsx
export interface Skill {
  id: number;
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  position: number[];
}

export interface SkillCategory {
  id: string;         // string ID for category
  name: string;       // category name (e.g., "Frontend Skills")
  skills: string[];   // skill names inside the category
}

export interface SkillAssessment {
  [skillId: number]: number | null;
}

export interface AssessmentFormProps {
  skillCategories: SkillCategory[];
  assessments: { [skillId: number]: number | null };
  isSubmitting: boolean;
  handleSkillLevelChange: (skillId: number, level: number) => void;
}

// src/components/assessment/PendingAssessmentsPage.tsx

export interface score {
  id: number;
  skillId: number;
  assessmentId: number;
  selfScore: number;
  leadScore: number | null;
  skill: Skill;
}

export interface Position {
  name: string;
}

export interface Team {
  name: string;
}

export interface Role {
  name: string;
}

export interface Lead {
  name: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  positionId: number;
  TeamId?: number;
  roleId?: number;
  leadId?: string;
  position?: Position;
  Team?: Team;
  Position?: Position;
  Role?: Role;
  Lead?: UserInfo;
}

export interface Assessment {
  id: number;
  userId: number;
  status: string;
  requestedAt: string;
  nextApprover: number;
  user: UserInfo;
  detailedScores: Score[];
  deadlineDate: Date;
  scheduledDate: Date;
}


// src/components/assessment/RatingControl.tsx

export interface RatingControlProps{
  value:number;
  onChange:(value:number)=>void;
  disabled?:boolean;
}


// src/components/assessment/SkillAssessment.tsx

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

// New Assessment Workflow Types
export interface AssessmentWithHistory {
  id: number;
  userId: string;
  status: AssessmentStatus;
  requestedAt: string;
  scheduledDate?: string;
  scheduleType: string;
  deadlineDays: number;
  deadlineDate?: string;
  completedAt?: string;
  currentCycle: number;
  nextApprover: number | null;
  initiatedBy: string;
  nextScheduledDate?: string;
  user?: UserInfo;
  detailedScores: DetailedScore[];
  history: AuditEntry[];
  isAccessible: boolean;
  wasRecentlyRejected?: boolean;
  rejectionReason?: string;
  cycle?: AssessmentCycle;
}

export interface DetailedScore {
  id: number;
  assessmentId: number;
  skillId: number;
  score: number | null;
  updatedAt: string;
  Skill: {
    id: number;
    name: string;
    basic: string;
    low: string;
    medium: string;
    high: string;
    expert: string;
  };
}

export interface AuditEntry {
  id: number;
  assessmentId: number;
  auditType: string;
  editorId: number;
  userId?: string;
  commentedBy?: string;
  cycleNumber: number;
  status?: string;
  
  // Score tracking fields
  skillName?: string;
  previousScore?: number;
  currentScore?: number;
  
  // Comments and timestamps
  comments?: string;
  auditedAt: string;
  createdAt: string;
}

export enum AssessmentStatus {
  INITIATED = "INITIATED",
  LEAD_WRITING = "LEAD_WRITING",
  EMPLOYEE_REVIEW = "EMPLOYEE_REVIEW",
  EMPLOYEE_APPROVED = "EMPLOYEE_APPROVED",
  EMPLOYEE_REJECTED = "EMPLOYEE_REJECTED",
  HR_FINAL_REVIEW = "HR_FINAL_REVIEW",
  COMPLETED = "COMPLETED",
  CANCELLED = "Cancelled"
}

export interface TeamMemberAssessment {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  position: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
  };
  leadId?: string;
  activeAssessments: AssessmentWithHistory[];
  latestCompletedAssessment?: AssessmentWithHistory;
}

export interface LeadSkillAssessment {
  skillId: number;
  leadScore: number;
}

export interface TeamStatistics {
  totalTeamMembers: number;
  assessments: {
    total: number;
    byStatus: {
      initiated: number;
      leadWriting: number;
      employeeReview: number;
      completed: number;
    };
  };
  pendingActions: number;
  recentAssessments: number;
}

export interface AssessmentCycle {
  id: number;
  title: string;
  createdBy: string;
  scheduledDate: string;
  scheduleType: string;
  deadlineDays: number;
  deadlineDate?: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  comments?: string;
  targetTeams: string[];
  excludedUsers: string[];
  totalAssessments: number;
  completedAssessments: number;
  createdAt: string;
  updatedAt: string;
  skills?: Array<{
    id: number;
    name: string;
  }>;
  assessments?: Assessment[];
}


