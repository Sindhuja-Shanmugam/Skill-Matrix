//components/criteria/SkillCreationModel

export interface Position {
  id: number;
  name: string;
}

export interface SkillCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editSkill?: SkillData & { id: number; positionId?: number };
  mode?: "create" | "edit";
}

export interface SkillData {
  name: string;
  basic: string;
  low: string;
  medium: string;
  high: string;
  expert: string;
  positionId?: number;
}

export interface UpgradeGuide {
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink: string;
  skillId: number | null;
}

//components/criteria/SkillCriteriaPage

export interface SkillCriterion {
  id: number;
  name: string;
  basic: string
  low: string;
  medium: string;
  high: string;
  expert: string;
  createdAt: string;
  createdBy: string;
  positionId: number;
}