import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { AssessmentRequest } from "../entities/assessment/AssessmentRequest";
import { AssessmentCycle } from "../entities/assessment/AssessmentCycle";
import { AssessmentCycleSkill } from "../entities/assessment/AssessmentCycleSkill";
import { Audit } from "../entities/assessment/Audit";
import { Position } from "../entities/Position";
import { Role } from "../entities/Role";
import { Score } from "../entities/assessment/Score";
import { Team } from "../entities/Team";
import { Skill } from "../entities/assessment/Skill";
import { User } from "../entities/User";
import { SkillUpgradeGuide } from "../entities/assessment/SkillUpgradeGuide";
import { Auth } from "../entities/Auth";
import { SkillTarget } from "../entities/target";
import { subTeam } from "../entities/subTeam";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.EXTERNAL_DATABASE_URL,
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  // username: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
    ssl: {
     rejectUnauthorized: false // Render uses self-signed certs
   },
  database: process.env.DB_NAME,
  synchronize: true, // Disable to avoid conflicts with existing schema
  logging: false,
  entities: [
    Skill,
    AssessmentRequest,
    AssessmentCycle,
    AssessmentCycleSkill,
    SkillUpgradeGuide,
    Role,
    Score,
    Team,
    subTeam,
    Position,
    User,
    Audit,
    Auth,
    SkillTarget
  ],
  // migrations: ["src/migrations/*.ts"],
  // migrationsTableName: "migrations",
  // migrationsRun: true
});


export const userRepo = AppDataSource.getRepository(User);
export const roleRepo = AppDataSource.getRepository(Role);
export const positionRepo = AppDataSource.getRepository(Position);
export const teamRepo = AppDataSource.getRepository(Team);
export const subTeamRepo = AppDataSource.getRepository(subTeam);
export const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequest);
export const assessmentCycleRepo = AppDataSource.getRepository(AssessmentCycle);
export const assessmentCycleSkillRepo = AppDataSource.getRepository(AssessmentCycleSkill);
export const scoreRepo = AppDataSource.getRepository(Score);
export const skillRepo = AppDataSource.getRepository(Skill);
export const AuditRepo = AppDataSource.getRepository(Audit);
export const SkillUpgradeGuideRepo = AppDataSource.getRepository(SkillUpgradeGuide);
export const SkillTargetRepo = AppDataSource.getRepository(SkillTarget);