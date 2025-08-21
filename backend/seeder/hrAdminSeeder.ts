import { AppDataSource } from "../config/dataSource";
import { Team } from "../entities/Team";
import { subTeam } from "../entities/subTeam";
import { Position } from "../entities/Position";
import { TeamType, subTeamType, PositionType } from "../types/entities";

export async function seedHRAdminData() {
  try {
    await AppDataSource.initialize();
    
    const teamRepository = AppDataSource.getRepository(Team);
    const subTeamRepository = AppDataSource.getRepository(subTeam);
    const positionRepository = AppDataSource.getRepository(Position);

    // Clear existing data (if any exists)
    try {
      await subTeamRepository.query('DELETE FROM sub_teams');
    } catch (error) {
      console.log('Sub-teams table does not exist yet');
    }
    
    try {
      await teamRepository.query('DELETE FROM teams');
    } catch (error) {
      console.log('Teams table does not exist yet');
    }
    
    try {
      await positionRepository.query('DELETE FROM positions');
    } catch (error) {
      console.log('Positions table does not exist yet');
    }

    // Seed Teams
    const teams: TeamType[] = [
      {
        id: 1,
        name: "InfoRiver",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "InfoBridge",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Valq",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const savedTeams = await teamRepository.save(teams);
    console.log("Teams seeded successfully");

    // Seed Sub-Teams
    const subTeams: Partial<subTeamType>[] = [
      // InfoRiver Sub-Teams
      {
        name: "Frontend Development",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      {
        name: "Backend Development",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      {
        name: "Quality Assurance",
        teamId: savedTeams[0].id,
        isActive: true,
      },
      
      // InfoBridge Sub-Teams
      {
        name: "Data Engineering",
        teamId: savedTeams[1].id,
        isActive: true,
      },
      {
        name: "Integration Team",
        teamId: savedTeams[1].id,
        isActive: true,
      },
      
      // Valq Sub-Teams
      {
        name: "Product Development",
        teamId: savedTeams[2].id,
        isActive: true,
      },
      {
        name: "Analytics Team",
        teamId: savedTeams[2].id,
        isActive: true,
      },
    ];

    await subTeamRepository.save(subTeams);
    console.log("Sub-teams seeded successfully");

    // Seed Positions
    const positions: Partial<PositionType>[] = [
      {
        name: "Frontend Developer",
        isActive: true,
      },
      {
        name: "Backend Developer",
        isActive: true,
      },
      {
        name: "Full Stack Developer",
        isActive: true,
      },
      {
        name: "Quality Assurance Engineer",
        isActive: true,
      },
      {
        name: "DevOps Engineer",
        isActive: true,
      },
      {
        name: "Data Engineer",
        isActive: true,
      },
      {
        name: "Product Manager",
        isActive: true,
      },
      {
        name: "HR Manager",
        isActive: true,
      },
      {
        name: "Team Lead",
        isActive: true,
      },
      {
        name: "Senior Developer",
        isActive: true,
      },
    ];

    await positionRepository.save(positions);
    console.log("Positions seeded successfully");

    console.log("HR Admin data seeded successfully!");
  } catch (error) {
    console.error("Error seeding HR Admin data:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedHRAdminData();
}