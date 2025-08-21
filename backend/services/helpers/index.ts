import { assessmentRequestRepo, scoreRepo, userRepo, skillRepo, AuditRepo } from "../../config/dataSource";
import { AssessmentStatus,  role, TIME_CONSTANTS, AssessmentScheduleType } from "../../enum/enum";
import { UserType } from "../../types/entities";

// Validation helpers
export const ValidationHelpers = {
  validateHRUser: async (userId: string) => {
    const user = await userRepo.findOne({ 
      where: { id: userId },
      relations: ["role"]
    });
    if (!user || user.role?.name !== role.HR) {
      return null;
    }
    return user;
  },

  validateAdmin: async(userId: string)=>{
    const user = await userRepo.findOne({ 
      where: { id: userId },
      relations: ["role"]
    });
    if (!user || user.role?.name !== "admin") {
      return null;
    }
    return user;
  },

  validateTeamLead: async (userId: string) => {
    const check_user = await userRepo.findOne({ 
      where: { leadId: userId },
    });
    const user = await userRepo.findOne({ 
      where: { id: userId },
      relations: ["role"]
    });
    if (!check_user) {
      // throw new Error("Only team leads can perform this operation");
      return null;
    }
    return user;
  },

  validateUserExists: async (userId: string) => {
    const user = await userRepo.findOne({ 
      where: { id: userId },
      relations: ["role"]
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  validateAssessmentExists: async (assessmentId: number) => {
    const assessment = await assessmentRequestRepo.findOne({
      where: { id: assessmentId },
      relations: ["user"]
    });
    if (!assessment) {
      throw new Error("Assessment not found");
    }
    return assessment;
  },

  validateSkillScore: (score: number, skillId: number) => {
    if (score < TIME_CONSTANTS.SCORE_MIN || score > TIME_CONSTANTS.SCORE_MAX) {
      throw new Error(`Invalid score for skill ${skillId}. Must be between ${TIME_CONSTANTS.SCORE_MIN} and ${TIME_CONSTANTS.SCORE_MAX}`);
    }
  },

  validateTargetUserRole: (user: UserType) => {
    if (![role.EMPLOYEE, role.LEAD].includes(user.role?.name as role)) {
      throw new Error("HR can only initiate assessments for employees and team leads");
    }
  }
};

// Utility helpers
export const UtilityHelpers = {
  calculateNextScheduledDate: (baseDate?: Date, scheduleType?: AssessmentScheduleType) => {
    const date = baseDate || new Date();
    const type = scheduleType || AssessmentScheduleType.QUARTERLY;
    
    const nextDate = new Date(date);
    
    switch (type) {
      case AssessmentScheduleType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case AssessmentScheduleType.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case AssessmentScheduleType.HALF_YEARLY:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case AssessmentScheduleType.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // Default to quarterly
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
    }
    
    return nextDate;
  },

  calculateDeadlineDate: (scheduledDate: Date, deadlineDays: number) => {
    const deadline = new Date(scheduledDate);
    deadline.setDate(deadline.getDate() + deadlineDays);
    return deadline;
  },

  validateDeadlineDays: (deadlineDays: number) => {
    if (deadlineDays < TIME_CONSTANTS.MIN_DEADLINE_DAYS || deadlineDays > TIME_CONSTANTS.MAX_DEADLINE_DAYS) {
      throw new Error(`Deadline days must be between ${TIME_CONSTANTS.MIN_DEADLINE_DAYS} and ${TIME_CONSTANTS.MAX_DEADLINE_DAYS}`);
    }
  },

  isOverdue: (deadlineDate: Date) => {
    return new Date() > deadlineDate;
  },

  setDayStart: (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  },

  getCurrentTime: () => new Date(),

  createScoreSnapshot: (scores: any[]) => {
    return scores.map(score => 
      `${score.Skill?.name || `Skill ${score.skillId}`}: ${score.leadScore || 'N/A'}/5`
    ).join(', ');
  },

  enhanceHistoryEntries: (history: any[]) => {
    return history.map(audit => ({
      ...audit,
      editorName: audit.editor?.name || 'System',
      isScoreChange: audit.auditType === 'SCORE_UPDATED',
      category: audit.auditType?.includes('SCORE') ? 'score' : 
               audit.auditType?.includes('APPROVED') ? 'approval' :
               audit.auditType?.includes('REJECTED') ? 'rejection' :
               audit.auditType?.includes('INITIATED') ? 'initiation' : 'general'
    }));
  }
};

// Database operation helpers
export const DatabaseHelpers = {
  createAuditEntry: async (params: {
    assessmentId: number;
    auditType: string;
    editorId: number;
    userId: string;
    comments?: string;
    commentedBy: string;
    status: string;
    cycleNumber?: number;
    skillName?: string;
    previousScore?: number;
    currentScore?: number;
  }) => {
    const currentTime = UtilityHelpers.getCurrentTime();
    return await AuditRepo.save({
      ...params,
      auditedAt: currentTime,
      createdAt: currentTime
    });
  },

  createScoreEntries: async (assessmentId: number, skillIds: number[]) => {
    const skillPromises = skillIds.map(async (skillId) => {
      const skill = await skillRepo.findOneBy({ id: skillId });
      if (skill) {
        const score = scoreRepo.create({
          assessmentId,
          skillId,
          score: null
        });
        return await scoreRepo.save(score);
      }
      return null;
    });
    
    return await Promise.all(skillPromises);
  },

  getAssessmentScoresAndHistory: async (assessmentId: number) => {
    const [scores, history] = await Promise.all([
      scoreRepo.find({
        where: { assessmentId },
        relations: ["Skill"]
      }),
      AuditRepo.find({
        where: { assessmentId },
        relations: ["editor"],
        order: { auditedAt: "ASC" }
      })
    ]);
    
    return { scores, history };
  },

  bulkCreateAssessments: async (
    users: UserType[], 
    hrId: string, 
    scheduledDate?: Date,
    scheduleType: AssessmentScheduleType = AssessmentScheduleType.QUARTERLY,
    deadlineDays: number = 1,
    deadlineDate?: Date,
    cycleId?: number
  ) => {
    const finalScheduledDate = scheduledDate || UtilityHelpers.getCurrentTime();
    const finalDeadlineDate = deadlineDate || UtilityHelpers.calculateDeadlineDate(finalScheduledDate, deadlineDays);

    const assessments = users.map(user => assessmentRequestRepo.create({
      userId: user.id,
      status: user.leadId ? AssessmentStatus.LEAD_WRITING : AssessmentStatus.INITIATED,
      initiatedBy: hrId,
      nextApprover: user.leadId ? parseInt(user.leadId) : null,
      scheduledDate: finalScheduledDate,
      scheduleType: scheduleType,
      deadlineDays: deadlineDays,
      deadlineDate: finalDeadlineDate,
      currentCycle: 1,
      cycleId: cycleId,
      nextScheduledDate: UtilityHelpers.calculateNextScheduledDate(finalScheduledDate, scheduleType),
      requestedAt: UtilityHelpers.getCurrentTime()
    }));

    return await assessmentRequestRepo.save(assessments);
  }
};