import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/custom/Card';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from './DashboardStats';
import { Building2, Target, AlertCircle } from 'lucide-react';
import { assessmentService, skillService, teamService, userService } from '@/services/api';
import { getAverageSkillLevel } from '@/utils/helper';

const HRDashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ basic:0, low: 0, medium: 0, high: 0, expert:0 });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [organizationStats, setOrganizationStats] = useState({
    totalEmployees: 0,
    teams: 0,
    skillCriteria: 0,
    avgOrgSkillLevel: 0
  });
  const [orgSkillStats, setOrgSkillStats] = useState({basic:0, low: 0, medium: 0, high: 0, expert:0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch org-wide skill stats
      const orgStats = await userService.getOrganizationSkillStats();
      setOrgSkillStats(orgStats);

      const matrix = await userService.getFullMatrix();
      const skillDetails = matrix.find((hr: any) => hr.userId === user.id)
      const pendingRequests = await assessmentService.getAssessmentsRequiringAction();
      const teamsData = await teamService.getAllTeams();
      const criteria = await skillService.getAllSkills();
      
      // Check if skillDetails exists and has mostRecentAssessmentScores
      const userSkills = skillDetails?.mostRecentAssessmentScores || [];
      const skillStats = {
        basic:userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 1).length : 0,
        low: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 2).length : 0,
        medium: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 3).length : 0,
        high: userSkills.length > 0 ? userSkills.filter((skill) => skill.Score == 4).length : 0,
        expert:userSkills.length>0 ? userSkills.filter((skill)=>skill.score == 5).length:0,
      };
      const avg: number = matrix.length
                  ? parseFloat((
                      matrix.reduce(
                        (acc, m) => {
                          const skillLevel = getAverageSkillLevel(m);
                          return acc + skillLevel;
                        },
                        0
                      ) / matrix.length
                    ).toFixed(1))
                  : 0;

      setStats(skillStats);
      setPendingRequests(Array.isArray(pendingRequests) ? pendingRequests.length : 
                       (pendingRequests?.data ? pendingRequests.data.length : 0));
      setOrganizationStats({
        totalEmployees: matrix?.length || 0,
        teams: teamsData?.length || 0,
        skillCriteria: criteria?.length || 0,
        avgOrgSkillLevel: avg
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <DashboardStats 
        stats={orgSkillStats}
        title="Organization Skills Overview"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{organizationStats.totalEmployees}</div>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{organizationStats.teams}</div>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
              <button 
                onClick={() => onNavigate('team-overview')} 
                className="w-full border h-9 rounded-md px-3 border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                View All Teams
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skill Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{organizationStats.skillCriteria}</div>
                <p className="text-sm text-gray-600">Active Criteria</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{organizationStats.avgOrgSkillLevel}</div>
                <p className="text-sm text-gray-600">Average Org Skill Level</p>
              </div>
              <button 
                onClick={() => onNavigate('skill-criteria')} 
                className="w-full border h-9 rounded-md px-3 border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Manage Criteria
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-orange-900">{pendingRequests}</div>
                <p className="text-sm text-orange-700">Final Approvals</p>
              </div>
              <button onClick={() => onNavigate('hr-assessment-management') } className="w-full text-primary-foreground h-9 rounded-md px-3 bg-orange-600 hover:bg-orange-700">
                Review Now
              </button>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default HRDashboard;
