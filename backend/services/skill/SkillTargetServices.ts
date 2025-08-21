import { scoreRepo, skillRepo, SkillTargetRepo } from "../../config/dataSource";
import { AuditType, SkillUpgradeGuideType } from "../../types/entities";
import { SkillUpgradeGuideRepo } from "../../config/dataSource";

const skillTargetService = {
    createTarget : async(userId: string, skillId: number, fromLevel: number, toLevel: number, id?: number)=>{
        const target = SkillTargetRepo.create({
            userId,
            skillId,
            fromLevel,
            toLevel
        });

        await SkillTargetRepo.save(target);
    },

    updateTarget : async(Audits: AuditType[], userId: string, assessmentId: number)=>{

        for(const Audit of Audits){
            const skill = await skillRepo.findOne({
                where:{
                    name: Audit.skillName,
                }
            });

            const target = await SkillTargetRepo.findOne({
                where:{
                    userId: userId,
                    skillId: skill.id
                }
            });

            if(target){
                const score = await scoreRepo.findOne({
                    where:{
                        assessmentId: assessmentId,
                        skillId: skill.id
                    }
                })
                if(score.score === 4){
                    await SkillTargetRepo.delete({id: target.id});
                    continue;
                }
                target.fromLevel = score.score

                SkillTargetRepo.save(target)
            }

        }
       
    },

    deleteTargetbyId : async(id: number)=>{
        await SkillTargetRepo.delete({id});
    },

    getSkillTargetbyUserId : async(userId: string)=>{
        return await SkillTargetRepo.find({
            where:{
                userId: userId
            },
            relations: ["skill"]
        })
    },

    getGuide: async (skillId: number, fromLevel: number, toLevel: number): Promise<SkillUpgradeGuideType> => {
        try {
        const guide = await SkillUpgradeGuideRepo.findOne({
            where: { skillId: skillId, fromLevel: fromLevel, toLevel: toLevel },
            relations: ["skill"],
        });

        if (!guide) {
            throw new Error("Guide not found");
        }

        return guide;
        } catch (error: any) {
        throw new Error(`Failed to retrieve guide: ${error.message}`);
        }
    },

    createUpgradeGuide: async(skillId: number, fromLevel: number, toLevel: number, guidance: string, resourceLink?: string) => {
        try {
            const upgradeGuide = SkillUpgradeGuideRepo.create({
                skillId,
                fromLevel,
                toLevel,
                guidance,
                resourceLink: resourceLink || null,
            });

            await SkillUpgradeGuideRepo.save(upgradeGuide);
            return upgradeGuide;
        } catch (error: any) {
            throw new Error(`Failed to create upgrade guide: ${error.message}`);
        }
    },
}

export default skillTargetService;