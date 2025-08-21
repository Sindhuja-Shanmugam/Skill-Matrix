import { toast } from "@/hooks/use-toast";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
console.log(API_BASE_URL);

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

interface SkillDetails {
  id: number;
  name: string;
  basic:string;
  low: string;
  medium: string;
  high: string;
  expert:string;
  position: number[];
}

// Function to make authenticated requests to the backend API
export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {}
) => {
  const { method = "GET", headers = {}, body, requiresAuth = true } = options;

  try {
    const token = localStorage.getItem("authToken");

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (requiresAuth && token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData; // Throw full error object for frontend to handle
  }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    toast({
      title: "Error",
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};

// Auth Services
export const authService = {
  login: (email: string, password: string) =>
    apiRequest("/auth/legacy-login", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    }),

  signup: (email: string, password: string) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    }),
    microsoftLogin: () =>{
      window.location.href = `${API_BASE_URL}/auth/start-login`;}
    }


// User Services
export const userService = {
  getProfile: () => apiRequest("/users/profile"),

  getAllUsers: (filters: { role?: string; position?: string; leadId?: string } = {}) =>
    apiRequest("/users/all-users", { method: "POST", body: filters }),

  getTeamMatrix: (teamName: string) =>
    apiRequest(`/users/matrix/team/${teamName}`),

  getFullMatrix: () => apiRequest("/users/matrix/full"),

  getTeamMemebers: (teamName: string) => apiRequest(`/users/team/${teamName}`),

  createUser: (userData: {
    userId: string;
    name: string;
    email?: string;
    role: string;
    position: string;
    team?: string;
    subTeam?: string;
    lead?: string;
    hr?: string;
    isActive?: boolean;
  }[]) => apiRequest("/users/create", { method: "POST", body: userData }),

  updateUser: (userData: {
    id: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    position?: string;
    team?: string;
    subTeam?: string;
    lead?: string;
    hr?: string;
    isActive?: boolean;
  }) =>apiRequest("/users/update", { method: "POST", body: userData }),

  deleteUser: (id: string) =>
    apiRequest(`/users/delete/${id}`, { method: "DELETE" }),

  getOrganizationSkillStats: () => apiRequest("/users/organization/skill-stats"),
};

// Skill Services
export const skillService = {
  getSkillById: (id: string) => apiRequest(`/skills/${id}`),

  getAllSkills: () => apiRequest("/skills/all-skills"),

  getSkillsByPosition: () => apiRequest("/skills/position"),

  getSkillsWithUpgradeGuides: () => apiRequest("/skills/guide"),

  createSkill: (data: SkillDetails) =>
    apiRequest("/skills/create", { method: "POST", body: data }),

  updateSkill: (data: SkillDetails) =>
    apiRequest("/skills/update", { method: "POST", body: data }),

  deleteSkill: (id: number) =>
    apiRequest(`/skills/delete/${id}`, { method: "DELETE" }),
};

export const positionService = {
  getAllPositions: () => apiRequest("/users/details?type=position"),
};

export const roleService = {
  getAllRoles: () => apiRequest("/users/details?type=role"),
};

export const teamService = {
  getAllTeams: () => apiRequest("/users/details?type=team"),
};

export const subTeamService = {
  getAllSubTeams: () => apiRequest("/users/details?type=subteam"),
  getSubTeamsByTeam: (teamId: number) => apiRequest(`/users/details?type=subteam`).then((subTeams: any[]) => 
    subTeams.filter(subTeam => subTeam.teamId === teamId)
  ),
};

// Assessment Services
export const assessmentService = {
  initiateAssessment: (data: {
    targetUserId: string;
    skillIds: number[];
    scheduledDate?: string;
    scheduleType?: string;
    deadlineDays?: number;
    comments?: string;
  }) => apiRequest("/assess/initiate", { method: "POST", body: data }),

  writeLeadAssessment: (assessmentId: number, skillScores: Array<{ skillId: number; leadScore: number }>, comments?: string) => 
    apiRequest(`/assess/lead-assessment/${assessmentId}`, { 
      method: "POST", 
      body: { skillScores, comments } 
    }),

  employeeReviewAssessment: (assessmentId: number, data: {
    approved: boolean;
    comments?: string;
    reviewerContext?: 'employee' | 'lead';
  }) => apiRequest(`/assess/employee-review/${assessmentId}`, { method: "POST", body: data }),

  hrFinalReview: (assessmentId: number, data: {
    approved: boolean;
    comments?: string;
  }) => apiRequest(`/assess/hr-final-review/${assessmentId}`, { method: "POST", body: data }),

  hrBulkFinalReview: (data: {
    assessmentIds: number[];
    approved: boolean;
    comments?: string;
  }) => apiRequest("/assess/hr-bulk-final-review", { method: "POST", body: data }),

  getAssessmentWithHistory: (assessmentId: number) =>
    apiRequest(`/assess/history/${assessmentId}`),

  getAssessmentsForRole: () =>
    apiRequest("/assess/role-assessments"),

  getAssessmentsRequiringAction: () =>
    apiRequest("/assess/pending-actions"),

  // Team Lead specific methods
  getTeamAssessments: () =>
    apiRequest("/assess/team/assessments"),

  getTeamMembers: () =>
    apiRequest("/assess/team/members"),

  getPendingTeamAssessments: () =>
    apiRequest("/assess/team/pending"),

  getTeamMemberAssessment: (userId: string) =>
    apiRequest(`/assess/team/member/${userId}`),

  getTeamAssessmentStatistics: () =>
    apiRequest("/assess/team/statistics"),

  // Access control methods
  checkAssessmentAccess: (assessmentId: number) =>
    apiRequest(`/assess/team/assessment/${assessmentId}/access`),

  checkUserAssessmentAccess: (userId: string) =>
    apiRequest(`/assess/team/user/${userId}/access`),

  // Bulk assessment for HR
  initiateBulkAssessment: (data: {
    assessmentTitle: string;
    includeTeams: string[];
    scheduledDate?: string;
    scheduleType?: string;
    deadlineDays?: number;
    comments?: string;
    excludeUsers?: string[];
  }) => apiRequest("/assess/bulk-assessment", { method: "POST", body: data }),

  getAssessmentCycles: () =>
    apiRequest("/assess/cycles"),

  getAssessmentCycleDetails: (cycleId: number) =>
    apiRequest(`/assess/cycles/${cycleId}`),

  cancelAssessmentCycle: (cycleId: number, comments?: string) =>
    apiRequest(`/assess/cycles/${cycleId}/cancel`, { 
      method: "POST", 
      body: { comments } 
    }),

  // Legacy methods
  getAllAssessments: () => apiRequest("/assess/all"),

  getAssessmentById: (id: string) => apiRequest(`/assess/${id}`),

  reviewAssessment: (id: string, data: any) =>
    apiRequest(`/assess/review/${id}`, { method: "POST", body: data }),

  getMyAssignedAssessments: () => apiRequest("/assess/pending-actions"),

  cancelAssessment: (assessmentId: string) =>
    apiRequest(`/assess/cancel/${assessmentId}`, { method: "DELETE" }),

  getUserLatestApprovedScores: () => apiRequest("/assess/scores"),

  getUserLatestApprovedScoresByUserId: (userId: string) =>
    apiRequest(`/assess/scores/${userId}`),

  // Get user assessment summaries (HR only)
  getUserAssessmentSummaries: () =>
    apiRequest("/assess/user-summaries"),

  // Get user assessment history (HR only)  
  getUserAssessmentHistory: (userId: string) =>
    apiRequest(`/assess/user-history/${userId}`),

  // Get assessment score change history
  getAssessmentScoreHistory: (assessmentId: number) =>
    apiRequest(`/assess/score-history/${assessmentId}`),
};

// Skill Upgrade Guide Services
export const skillUpgradeService = {

  getGuide: (
    skillId: number,
    currentLevel: number,
    targetLevel: number,
  ) => apiRequest("/targets/guide", { 
    method: "POST", 
    body: {
      skillId: skillId,
      fromLevel: currentLevel,
      toLevel: targetLevel
    }
  }),

  createTarget: (
    data : { skillId: number, fromLevel: number, toLevel: number, guidance: string, resourceLink?: string }
  ) => apiRequest("/targets/upgrade-guide/create",{ method: "POST", body: data }),

  getTarget: ( id: string) => apiRequest(`/targets/skillTarget?userId=${id}`),

  updateTarget: (
    data : { userId: string, skillId: number, from: number, to: number }
  ) => apiRequest("/targets/update",{ method: "PUT", body: data }),

  deleteTarget: ( id: number ) => apiRequest(`/targets/delete?id=${id}`,{ method: "DELETE" }),
};

export const adminService = {
  // Organization stats
  getOrganizationStats: () => apiRequest("/admin/organization/stats"),
  
  // Team management
  createTeam: (data: { name: string; description?: string }) => 
    apiRequest("/admin/teams", { method: "POST", body: data }),
  
  getAllTeams: (includeDeleted: boolean = false) => 
    apiRequest(`/admin/teams?includeDeleted=${includeDeleted}`),
  
  getTeamById: (id: number, includeDeleted: boolean = false) => 
    apiRequest(`/admin/teams/${id}?includeDeleted=${includeDeleted}`),
  
  updateTeam: (id: number, data: { name?: string; description?: string }) => 
    apiRequest(`/admin/teams/${id}`, { method: "PUT", body: data }),
  
  deleteTeam: (id: number) => 
    apiRequest(`/admin/teams/${id}`, { method: "DELETE" }),
  
  restoreTeam: (id: number) => 
    apiRequest(`/admin/teams/${id}/restore`, { method: "POST" }),
  
  // SubTeam management
  createSubTeam: (data: { name: string; description?: string; teamId: number }) => 
    apiRequest("/admin/subteams", { method: "POST", body: data }),
  
  getAllSubTeams: (includeDeleted: boolean = false) => 
    apiRequest(`/admin/subteams?includeDeleted=${includeDeleted}`),
  
  getSubTeamById: (id: number, includeDeleted: boolean = false) => 
    apiRequest(`/admin/subteams/${id}?includeDeleted=${includeDeleted}`),
  
  updateSubTeam: (id: number, data: { name?: string; description?: string; teamId?: number }) => 
    apiRequest(`/admin/subteams/${id}`, { method: "PUT", body: data }),
  
  deleteSubTeam: (id: number) => 
    apiRequest(`/admin/subteams/${id}`, { method: "DELETE" }),
  
  restoreSubTeam: (id: number) => 
    apiRequest(`/admin/subteams/${id}/restore`, { method: "POST" }),
  
  // Position management
  createPosition: (data: { name: string; description?: string }) => 
    apiRequest("/admin/positions", { method: "POST", body: data }),
  
  getAllPositions: (includeDeleted: boolean = false) => 
    apiRequest(`/admin/positions?includeDeleted=${includeDeleted}`),
  
  getPositionById: (id: number, includeDeleted: boolean = false) => 
    apiRequest(`/admin/positions/${id}?includeDeleted=${includeDeleted}`),
  
  updatePosition: (id: number, data: { name?: string; description?: string }) => 
    apiRequest(`/admin/positions/${id}`, { method: "PUT", body: data }),
  
  deletePosition: (id: number) => 
    apiRequest(`/admin/positions/${id}`, { method: "DELETE" }),
  
  restorePosition: (id: number) => 
    apiRequest(`/admin/positions/${id}/restore`, { method: "POST" }),
};

