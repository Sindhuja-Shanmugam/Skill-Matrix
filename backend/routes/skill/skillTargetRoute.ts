import SkillTargetController from "../../controllers/skill/skillTargetController";
import authorizeRoles from "../../middlewares/authorizeRole";
import { role } from "../../enum/enum";

const skillTargetRoutes = {
  name: "target-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "POST",
        path: "/create",
        options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.createTarget,
      },

      {
        method: "GET",
        path: "/skillTarget",
        options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.getTarget,
      },

      {
        method: "DELETE",
        path: "/delete",
        options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.deleteTarget,
      },

      {
        method: "POST",
        path: '/guide',
        options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillTargetController.getGuide,
      },
      {
        method: "POST",
        path: '/upgrade-guide/create',
        options: authorizeRoles([role.HR, role.ADMIN, role.LEAD]),
        handler: SkillTargetController.createUpgradeGuide,
      }
      
    ]);
  },
};

export default skillTargetRoutes;