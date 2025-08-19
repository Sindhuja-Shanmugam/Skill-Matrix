import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import { AppDataSource } from "./config/dataSource";
import userRoutes from "./routes/UserRoute";
import skillRoutes from "./routes/skill/skillRoute";
import skillTargetRoutes from "./routes/skill/skillTargetRoute";
import Jwt from "@hapi/jwt";
import authRoutes from "./routes/AuthRoute";
import assessmentRoutes from "./routes/assessment/AssessmentRoutes";
import TeamAssessmentRoutes from "./routes/team/TeamAssessmentRoutes";
import assessmentCycleRoutes from "./routes/cycle/AssessmentCycleRoutes";
import requestRoutes from "./routes/skill/SkillUpdateRequestRoute";
import { HRAdminRoutes } from "./routes/admin/HRAdminRoutes";


dotenv.config();

const init = async () => {
  // Initialize database connection first
  await AppDataSource.initialize();
  console.log("Database connected");

  const server = Hapi.server({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
        credentials: true,
      },
    },
  });

  await server.register(Jwt);

  server.auth.strategy("jwt", "jwt", {
    keys: process.env.JWT_SECRET_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
    },
    validate: async (artifacts: any, request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      return {
        isValid: true,
        credentials: { user: artifacts.decoded.payload },
      };
    },
  });

  server.auth.default("jwt");

  await server.register({
    plugin: userRoutes,
    options: {},
    routes: {
      prefix: "/api/users",
    },
  });

  await server.register({
    plugin: skillRoutes,
    options: {},
    routes: {
      prefix: "/api/skills",
    },
  });

  await server.register({
    plugin: assessmentRoutes,
    options: {},
    routes: {
      prefix: "/api/assess",
    },
  });

  await server.register({
    plugin: assessmentCycleRoutes,
    options: {},
    routes: {
      prefix: "/api/assess",
    },
  });

  await server.register({
    plugin: TeamAssessmentRoutes,
    options: {},
    routes: {
      prefix: "/api/assess",
    },
  })

  await server.register({
    plugin: requestRoutes,
    options: {},
    routes: {
      prefix: "/api/requests",
    },
  });

  await server.register({
    plugin: skillTargetRoutes,
    options: {},
    routes: {
      prefix: "/api/targets",
    },
  });

  await server.register({
    plugin: authRoutes,
    options: {},
    routes: {
      prefix: "/api/auth",
    },
  });

  // Register HR Admin routes
  await server.register({
    plugin: {
      name: 'hr-admin-routes',
      register: HRAdminRoutes
    },
    options: {},
    routes: {
      prefix: "/api/admin",
    },
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
