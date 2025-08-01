import { EntitySchema } from "typeorm";
import { AssessmentCycleSkillType } from "../../types/entities";

export const AssessmentCycleSkill = new EntitySchema<AssessmentCycleSkillType>({
  name: "AssessmentCycleSkill",
  tableName: "assessment_cycle_skills",
  columns: {
    cycleId: {
      type: Number,
      name: "cycle_id",
      primary: true,
    },
    skillId: {
      type: Number,
      name: "skill_id",
      primary: true,
    },
  },
  relations: {
    cycle: {
      type: "many-to-one",
      target: "AssessmentCycle",
      joinColumn: {
        name: "cycle_id",
      },
      onDelete:"CASCADE"
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: {
        name: "skill_id",
      },
      onDelete:"CASCADE"
    },
  },
});

export default AssessmentCycleSkill;
