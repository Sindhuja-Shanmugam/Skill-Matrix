import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Search,
  UserPlus,
  BarChart3,
  TrendingUp,
  X,
  User,
  Mail,
  Briefcase,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { userService, assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
// import UserManagementModal from "./UserManagementModal";
import DeleteModal from "../../lib/DeleteModal";
import { UserDetailModal } from "../admin/modals/UserDetailModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import{TeamMember,SkillScore,SkillModalData} from "../../types/teamTypes";
import { UserData } from "../../types/admin";
import { verifyLead } from "@/utils/helper";

const TeamOverviewPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skillModalData, setSkillModalData] = useState<SkillModalData | null>(
    null
  );
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<TeamMember | null>(null);
  const [userModalMode, setUserModalMode] = useState<"add" | "edit">("add");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});


  useEffect(() => {
    fetchTeamData();
  }, [user]);


  // Prevent body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showSkillModal || showUserModal || showDeleteModal || showUserDetailModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [showSkillModal, showUserModal, showDeleteModal, showUserDetailModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns({});
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email &&
        member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && (member.id !== user.id);
  });

  const getSkillLevelColor = (level: number) => {
    if (level >= 4) return "bg-green-100 text-green-800";
    if (level >= 3) return "bg-blue-100 text-blue-800";
    if (level >= 2) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getAverageSkillLevel = (member: TeamMember) => {
    if (
      !member.mostRecentAssessmentScores ||
      member.mostRecentAssessmentScores.length === 0
    ) {
      return 0;
    }
    const total = member.mostRecentAssessmentScores.reduce(
      (sum, score) => sum + score.Score,
      0
    );
    return total / member.mostRecentAssessmentScores.length;
  };

  

  // Prepare data for skill average chart
  const getSkillAverages = () => {
    const skillMap = new Map<string, { total: number; count: number }>();

    teamMembers.forEach((member) => {
      if (
        member.mostRecentAssessmentScores &&
        member.mostRecentAssessmentScores.length > 0
      ) {
        member.mostRecentAssessmentScores.forEach((score) => {
          const skillName = score.skillName;
          if (skillMap.has(skillName)) {
            const existing = skillMap.get(skillName)!;
            skillMap.set(skillName, {
              total: existing.total + score.Score,
              count: existing.count + 1,
            });
          } else {
            skillMap.set(skillName, {
              total: score.Score,
              count: 1,
            });
          }
        });
      }
    });

    return Array.from(skillMap.entries())
      .map(([skillName, data]) => ({
        skillName,
        averageScore: Number((data.total / data.count).toFixed(2)),
        memberCount: data.count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  };

  const skillAverageData = getSkillAverages();

  // Prepare member ranking data
  const getMemberRankings = () => {
    const membersWithScores = teamMembers
      .filter(
        (member) =>
          member.hasRecentAssessment &&
          member.mostRecentAssessmentScores?.length > 0
      )
      .map((member) => {
        const avgScore = getAverageSkillLevel(member);
        const assessmentCount = member.mostRecentAssessmentScores?.length || 0;
        // Composite score: 70% average score + 30% assessment completion (normalized)
        const maxAssessments = Math.max(
          ...teamMembers.map((m) => m.mostRecentAssessmentScores?.length || 0)
        );
        const normalizedAssessmentScore =
          maxAssessments > 0 ? (assessmentCount / maxAssessments) * 4 : 0;
        const compositeScore = avgScore * 0.7 + normalizedAssessmentScore * 0.3;

        return {
          name: member.name,
          avgScore: Number(avgScore.toFixed(2)),
          assessmentCount,
          compositeScore: Number(compositeScore.toFixed(2)),
          isTopPerformer: true, // Will be set based on ranking
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);

    // Get top 5 and bottom 5
    const top3Performers = membersWithScores
      .slice(0, 5)
      .map((member) => ({ ...member, isTopPerformer: true }));

    return [...top3Performers];
  };

  const memberRankingData = getMemberRankings();

  const handleViewScores = async (member: TeamMember) => {
    try {
      // Fetch detailed scores for the member
      const response =
        await assessmentService.getUserLatestApprovedScoresByUserId(member.id);
      const scores = response.success ? response.data : [];
      setSkillModalData({
        memberName: member.name,
        skills: scores,
      });
      setShowSkillModal(true);
    } catch (error) {
      toast({ title: "Failed to load skill scores", variant: "destructive" });
    }
  };

  const closeModal = () => {
    setShowSkillModal(false);
    setSkillModalData(null);
  };

  const handleAddUser = () => {
    setUserModalMode("add");
    setEditingUser(null);
    setShowUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {

      await userService.deleteUser(userToDelete.id);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      // Refresh the team data
      fetchTeamData();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleUserModalSuccess = () => {
    fetchTeamData();
  };

  const handleViewUserDetail = (member: TeamMember) => {
    setSelectedUserForDetail(member);
    setShowUserDetailModal(true);
  };

  const handleCloseUserDetailModal = () => {
    setShowUserDetailModal(false);
    setSelectedUserForDetail(null);
  };

  // Convert TeamMember to UserData format for the modal
  const convertTeamMemberToUserData = (member: TeamMember): UserData => {
    if (!member) {
      throw new Error("Member data is required");
    }
    
    return {
      id: member.id || "",
      userId: member.userId || "",
      name: member.name || "",
      email: member.email,
      phone: undefined, // TeamMember doesn't have phone field
      profilePhoto: undefined, // TeamMember doesn't have profilePhoto field
      isActive: true, // Default to active since we're showing team members
      createdAt: new Date().toISOString(), // Default date
      updatedAt: new Date().toISOString(),
      deletedAt: undefined,
      role: member.role || undefined,
      position: member.position || undefined,
      Team: member.Team || undefined,
      subTeam: member.subTeam || undefined,
      lead: member.lead ? {
        id: parseInt(member.lead.id),
        name: member.lead.name,
        userId: member.lead.userId,
      } : undefined,
      hr: member.hr ? {
        id: parseInt(member.hr.id),
        name: member.hr.name,
        userId: member.hr.userId,
      } : undefined,
      leadId: member.lead ? parseInt(member.lead.id) : undefined,
      hrId: member.hr ? parseInt(member.hr.id) : undefined,
      roleId: member.role?.id || 0,
      positionId: member.position?.id || 0,
      teamId: member.Team?.id || 0,
      subTeamId: member.subTeam?.id,
      skills: member.mostRecentAssessmentScores?.map(score => ({
        id: score.skillId || 0,
        name: score.skillName || "",
        level: score.Score || 0,
        lastAssessed: new Date().toISOString(),
      })) || [],
    };
  };

  const fetchTeamData = async () => {
    try {
      let data;
      if (user?.role?.name === "hr") {
        // HR sees all members
        data = await userService.getFullMatrix();
      } else if (verifyLead(user.id)) {
        // Team lead sees team members
        data = await userService.getTeamMatrix(user?.Team?.name);
      } else {
        // Regular users see team members
        data = await userService.getTeamMatrix(user?.Team?.name);
      }
      setTeamMembers(data);
    } catch (err) {
      toast({ title: "Failed to load team members", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" ">
      {/* Header */}
      {/* <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {user?.role?.name === "hr" ? "All Members Overview" : "Team Overview"}
        </h1>
        {user?.role?.name === "hr" && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={handleAddUser}
          >
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </button>
        )}
      </div> */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">With Assessments</p>
              <p className="text-2xl font-bold text-green-600">
                {teamMembers.filter((m) => m.hasRecentAssessment).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Skill Level</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamMembers.length
                  ? (
                      teamMembers.reduce(
                        (acc, m) => acc + getAverageSkillLevel(m),
                        0
                      ) / teamMembers.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">No Assessment</p>
              <p className="text-2xl font-bold text-orange-600">
                {teamMembers.filter((m) => !m.hasRecentAssessment).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Team Skills Average Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Skills Average Performance
            </h3>
          </div>
          <div className="p-6">
            {skillAverageData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No skill assessment data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={skillAverageData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="skillName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}/5`,
                      name === "averageScore" ? "Average Score" : name,
                    ]}
                    labelFormatter={(label) => `Skill: ${label}`}
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Average Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 5 Performers
            </h3>
          </div>
          <div className="p-4">
            {memberRankingData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assessment data available for ranking</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {memberRankingData.map((member, index) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-3 p-2 bg-green-50 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          {member.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Avg: {member.avgScore}/5</span>
                          <span>•</span>
                          <span>{member.assessmentCount} skills</span>
                        </div>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(member.avgScore / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {member.avgScore}/5
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search members..."
                className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Cards */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-lg text-gray-600">Loading team members...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewUserDetail(member)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-sm text-gray-500">
                        ID: {member.userId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(
                        getAverageSkillLevel(member)
                      )}`}
                    >
                      {getAverageSkillLevel(member).toFixed(1)}/5
                    </span> */}
                    {/* {user?.role?.name === "admin" && (
                      <div className="relative">
                        <button
                          className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(member.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdowns[member.id] && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  handleEditUser(member);
                                  setOpenDropdowns({});
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                onClick={() => {
                                  handleDeleteUser(member);
                                  setOpenDropdowns({});
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )} */}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span>{member.role.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{member.position?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{member.Team?.name }</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Skills Assessed: </span>
                    <span className="font-medium">
                      {member.mostRecentAssessmentScores?.length || 0}
                    </span>
                  </div>
                  {/* Only show View Scores button if member has recent assessments */}
                  {member.hasRecentAssessment && (
                    <button
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewScores(member);
                      }}
                    >
                      View Scores
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Skill Scores Modal */}
      {showSkillModal && skillModalData && (
        <div className="modal-backdrop bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg max-w-4xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                Skill Scores - {skillModalData.memberName}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {skillModalData.skills.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No skill assessments found for this member.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillModalData.skills.map((skill) => (
                    <div key={skill.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{skill.skill_name}</h3>
                       
                      </div>

                      <div className="space-y-2 text-sm">
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lead Score:</span>
                          <span className="font-medium">
                            {skill.score}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Assessment Date:
                          </span>
                          <span className="font-medium">
                            {new Date(skill.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUserForDetail && selectedUserForDetail.id ? convertTeamMemberToUserData(selectedUserForDetail) : null}
        isOpen={showUserDetailModal}
        onClose={handleCloseUserDetailModal}
      />
    </div>
  );
};

export default TeamOverviewPage;
