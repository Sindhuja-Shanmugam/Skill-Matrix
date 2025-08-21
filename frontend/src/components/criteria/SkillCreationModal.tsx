import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom/Card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  positionService,
  skillService,
  skillUpgradeService,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Save,
  X,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {Position,SkillCreationModalProps,SkillData,UpgradeGuide} from "../../types/criteria";


const SKILL_LEVELS = [
  { value: 1, label: "Basic", color: "bg-gray-100 text-gray-800" },
  { value: 2, label: "Low", color: "bg-red-100 text-red-800" },
  { value: 3, label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: 4, label: "High", color: "bg-blue-100 text-blue-800" },
  { value: 5, label: "Expert", color: "bg-green-100 text-green-800" },
];

const SkillCreationModal: React.FC<SkillCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editSkill,
  mode = "create",
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSkillId, setCreatedSkillId] = useState<number | null>(
    editSkill?.id || null
  );
  const isEditMode = mode === "edit" || !!editSkill;

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Positions data
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>(
    editSkill?.positionId ? [editSkill.positionId] : []
    
  );
  const [positionsOpen, setPositionsOpen] = useState(false);

  // Step 1: Skill Creation/Edit Data
  const [skillData, setSkillData] = useState<SkillData>({
    name: editSkill?.name || "",
    basic:editSkill?.basic || "",
    low: editSkill?.low || "",
    medium: editSkill?.medium || "",
    high: editSkill?.high || "",
    expert: editSkill?.expert || "",
  });

  // Step 2: Upgrade Guides Data
  const [upgradeGuides, setUpgradeGuides] = useState<UpgradeGuide[]>([]);
  const [completedGuides, setCompletedGuides] = useState<Set<string>>(
    new Set()
  );

  // Fetch positions and initialize data when component mounts or editSkill changes
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const positionsData = await positionService.getAllPositions();
        setPositions(positionsData);
      } catch (err) {
        console.error("Failed to fetch positions:", err);
      }
    };

    fetchPositions();

    // Initialize with edit data if provided
    if (editSkill) {
      setSkillData({
        name: editSkill.name || "",
        basic: editSkill.basic || "",
        low: editSkill.low || "",
        medium: editSkill.medium || "",
        high: editSkill.high || "",
        expert: editSkill.expert || "",
      });
      setSelectedPositions(editSkill.positionId ? [editSkill.positionId] : []);
      setCreatedSkillId(editSkill.id);
    }
  }, [editSkill]);

  // Detect changes for Save button
  useEffect(() => {
    if (!isEditMode || !editSkill) {
      setHasChanges(false);
      return;
    }
    const skillChanged =
      skillData.name !== (editSkill.name || "") ||
      skillData.basic !== (editSkill.basic || "") ||
      skillData.low !== (editSkill.low || "") ||
      skillData.medium !== (editSkill.medium || "") ||
      skillData.high !== (editSkill.high || "") ||
      skillData.expert !== (editSkill.expert || "");
    const positionsChanged =
      JSON.stringify(selectedPositions) !== JSON.stringify(editSkill.positionId ? [editSkill.positionId] : []);
    setHasChanges(skillChanged || positionsChanged);
  }, [skillData, selectedPositions, editSkill, isEditMode]);

  // Generate all possible upgrade paths (1->2, 1->3, 1->4, 1->5, 2->3, 2->4, 2->5, 3->4, 3->5, 4->5)
  const generateUpgradePaths = () => {
    const paths: { fromLevel: number; toLevel: number }[] = [];
    for (let from = 1; from <= 4; from++) {
      for (let to = from + 1; to <= 5; to++) {
        paths.push({ fromLevel: from, toLevel: to });
      }
    }
    return paths;
  };

  const upgradePaths = generateUpgradePaths();

  // Initialize upgrade guides when moving to step 2
  const initializeUpgradeGuides = () => {
    if (upgradeGuides.length === 0) {
      console.log("Initializing upgrade guides with paths:", upgradePaths);
      const initialGuides = upgradePaths.map((path) => ({
        fromLevel: path.fromLevel,
        toLevel: path.toLevel,
        guidance: "",
        resourceLink: "",
        skillId: createdSkillId || null,
      }));
      console.log("Created initial guides:", initialGuides);
      setUpgradeGuides(initialGuides);
    }
  };

  const handlePositionChange = (positionId: number) => {
    setSelectedPositions((prev) => {
      if (prev.includes(positionId)) {
        return prev.filter((id) => id !== positionId);
      } else {
        return [...prev, positionId];
      }
    });
  };

  const handleSkillCreate = async () => {
    if (
      !skillData.name ||
      !skillData.basic ||
      !skillData.low ||
      !skillData.medium ||
      !skillData.high||
      !skillData.expert
    ) {
      setError("All skill fields are required");
      return;
    }

    if (selectedPositions.length === 0) {
      setError("Please select at least one position");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (isEditMode && editSkill) {
        // Update existing skill
        response = await skillService.updateSkill({
          id: editSkill.id,
          name: skillData.name,
          basic:skillData.basic,
          low: skillData.low,
          medium: skillData.medium,
          high: skillData.high,
          expert:skillData.expert,
          position: selectedPositions,
        });
        console.log("Skill updated successfully:", response);
        onSuccess();
        handleClose();
      } else {
        // Create new skill
        response = await skillService.createSkill({
          id: 0, // Will be generated by backend
          name: skillData.name,
          basic:skillData.basic,
          low: skillData.low,
          medium: skillData.medium,
          high: skillData.high,
          expert:skillData.expert,
          position: selectedPositions,
        });
        console.log("Skill created successfully:", response);
        setCreatedSkillId(response.id);
        
        // Initialize upgrade guides immediately with the new skill ID
        const initialGuides = upgradePaths.map((path) => ({
          fromLevel: path.fromLevel,
          toLevel: path.toLevel,
          guidance: "",
          resourceLink: "",
          skillId: response.id,
        }));
        setUpgradeGuides(initialGuides);
        
        setCurrentStep(2);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
          ? "Failed to update skill"
          : "Failed to create skill"
      );
    } finally {
      setLoading(false);
    }
  };

  console.log("Skill ID", createdSkillId);

  const handleUpgradeGuideUpdate = (
    index: number,
    field: keyof UpgradeGuide,
    value: string
  ) => {
    const updatedGuides = [...upgradeGuides];
    updatedGuides[index] = {
      ...updatedGuides[index],
      [field]: value,
      skillId: createdSkillId || null,
    };
    setUpgradeGuides(updatedGuides);
  };

  const handleGuideSave = async () => {
    // Ensure upgrade guides are initialized
    if (upgradeGuides.length === 0) {
      initializeUpgradeGuides();
      setError("Please wait for upgrade guides to initialize");
      return;
    }
    
    if (upgradeGuides.some((guide) => !guide.guidance.trim())) {
      setError("Guidance is required for each upgrade path");
      return;
    }
    if (!createdSkillId) {
      setError("Skill ID not found");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      console.log("All upgrade guides before saving:", upgradeGuides);

      for (const guide of upgradeGuides) {
        if (!guide.guidance.trim()) continue; // Skip empty guides
        
        // Validate that fromLevel and toLevel are valid numbers
        if (!Number.isInteger(guide.fromLevel) || !Number.isInteger(guide.toLevel)) {
          console.error("Invalid level values:", guide);
          setError(`Invalid level values for guide: ${guide.fromLevel} -> ${guide.toLevel}`);
          return;
        }
        
        console.log("Saving guide:", guide);
        console.log("Guide fromLevel:", guide.fromLevel, "toLevel:", guide.toLevel);
        await skillUpgradeService.createTarget({
          skillId: createdSkillId,
          fromLevel: guide.fromLevel,
          toLevel: guide.toLevel,
          guidance: guide.guidance,
          resourceLink: guide.resourceLink || undefined,
        });
        const guideKey = `${guide.fromLevel}-${guide.toLevel}`;
        setCompletedGuides((prev) => new Set([...prev, guideKey]));
      }

      // Mark all guides as completed
      const allGuideKeys = upgradeGuides.map(
        (guide) => `${guide.fromLevel}-${guide.toLevel}`
      );
      setCompletedGuides(new Set(allGuideKeys));
    } catch (error) {
      console.error("Error saving guides:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save upgrade guides"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSkillData({
      name: "",
      basic:"",
      low: "",
      medium: "",
      high: "",
      expert: "",
    });
    setSelectedPositions([]);
    setUpgradeGuides([]);
    setCompletedGuides(new Set());
    setCreatedSkillId(null);
    setError(null);
    onClose();
  };

  console.log("Upgrade Guides:", upgradeGuides);
  console.log("Completed Guides:", completedGuides);

  const getLevelLabel = (level: number) => {
    return (
      SKILL_LEVELS.find((l) => l.value === level)?.label || `Level ${level}`
    );
  };

  const getLevelColor = (level: number) => {
    return (
      SKILL_LEVELS.find((l) => l.value === level)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const isGuideCompleted = (fromLevel: number, toLevel: number) => {
    return completedGuides.has(`${fromLevel}-${toLevel}`);
  };

  const allGuidesCompleted = upgradePaths.every((path) =>
    isGuideCompleted(path.fromLevel, path.toLevel)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isEditMode ? "Edit Skill Criterion" : "Create New Skill Criterion"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the skill details and proficiency levels"
              : currentStep === 1
              ? "Step 1: Define the skill and its proficiency levels"
              : "Step 2: Create upgrade guides between skill levels"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skillName">Skill Name</Label>
                <Input
                  id="skillName"
                  value={skillData.name || ""}
                  onChange={(e) =>
                    setSkillData({ ...skillData, name: e.target.value })
                  }
                  placeholder="e.g., React Development"
                />
              </div>

              <div className="space-y-2">
                <Label>Applicable Positions</Label>
                <Popover open={positionsOpen} onOpenChange={setPositionsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={positionsOpen}
                      className="w-full justify-between"
                    >
                      {selectedPositions.length > 0
                        ? `${selectedPositions.length} position${
                            selectedPositions.length > 1 ? "s" : ""
                          } selected`
                        : "Select positions..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
                      {positions.map((position) => (
                        <div
                          key={position.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`position-${position.id}`}
                            checked={selectedPositions.includes(position.id)}
                            onCheckedChange={() =>
                              handlePositionChange(position.id)
                            }
                          />
                          <Label
                            htmlFor={`position-${position.id}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {position.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label>Skill Level Definitions</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      key: "basic",
                      label: "Basic level",
                      placeholder: "Description for basic level proficiency",
                    },
                    {
                      key: "low",
                      label: "Low Level",
                      placeholder: "Description for low level proficiency",
                    },
                    {
                      key: "medium",
                      label: "Medium Level",
                      placeholder: "Description for medium level proficiency",
                    },
                    {
                      key: "high",
                      label: "High Level",
                      placeholder: "Description for high level proficiency",
                    },
                    {
                      key: "expert",
                      label: "Expert Level",
                      placeholder: "Description for expert level proficiency",
                    },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-sm font-medium">{label}</Label>
                      <Textarea
                        value={String(skillData[key as keyof SkillData] || "")}
                        onChange={(e) =>
                          setSkillData({ ...skillData, [key]: e.target.value })
                        }
                        placeholder={placeholder}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              {isEditMode ? (
                hasChanges && (
                  <Button
                    onClick={handleSkillCreate}
                    disabled={
                      loading ||
                      !skillData.name ||
                      !skillData.basic ||
                      !skillData.low ||
                      !skillData.medium ||
                      !skillData.high ||
                      !skillData.expert ||
                      selectedPositions.length === 0
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleSkillCreate}
                  disabled={
                    loading ||
                    !skillData.name ||
                    !skillData.basic ||
                    !skillData.low ||
                    !skillData.medium ||
                    !skillData.high ||
                    !skillData.expert ||
                    selectedPositions.length === 0
                  }
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {loading ? "Creating..." : "Next: Add Upgrade Guides"}
                </Button>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Skill Created Successfully!
                </span>
              </div>
              <p className="text-blue-700 text-sm">
                Now create upgrade guides for each skill level transition. These
                guides will help users understand how to progress from one level
                to another.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeGuides.map((guide, index) => {
                const isCompleted = isGuideCompleted(
                  guide.fromLevel,
                  guide.toLevel
                );

                return (
                  <Card
                    key={`${guide.fromLevel}-${guide.toLevel}`}
                    className={
                      isCompleted ? "border-green-200 bg-green-50" : ""
                    }
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <Badge className={getLevelColor(guide.fromLevel)}>
                          {getLevelLabel(guide.fromLevel)}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge className={getLevelColor(guide.toLevel)}>
                          {getLevelLabel(guide.toLevel)}
                        </Badge>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Upgrade Guidance *</Label>
                        <Textarea
                          value={guide.guidance}
                          onChange={(e) =>
                            handleUpgradeGuideUpdate(
                              index,
                              "guidance",
                              e.target.value
                            )
                          }
                          placeholder="Describe what the user needs to learn or do to progress from this level to the next..."
                          rows={3}
                          disabled={isCompleted}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Resource Link (Optional)
                        </Label>
                        <Input
                          value={guide.resourceLink || ""}
                          onChange={(e) =>
                            handleUpgradeGuideUpdate(
                              index,
                              "resourceLink",
                              e.target.value
                            )
                          }
                          placeholder="https://example.com/learning-resource"
                          disabled={isCompleted}
                        />
                      </div>
                      {/* Individual save buttons removed */}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Skill Details
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                {!allGuidesCompleted && (
                  <Button
                    onClick={handleGuideSave}
                    disabled={
                      loading ||
                      upgradeGuides.some((guide) => !guide.guidance.trim())
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save All Guides"}
                  </Button>
                )}
                <Button
                  onClick={handleFinish}
                  disabled={!allGuidesCompleted}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Skill Creation
                </Button>
              </div>
            </div>

            {!allGuidesCompleted && (
              <div className="text-center text-sm text-gray-600">
                Save all upgrade guides to complete the skill creation process.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkillCreationModal;
