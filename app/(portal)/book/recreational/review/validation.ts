export type ReviewValidationItem = {
  id: string;
  isUnavailable: boolean;
  isCompetitionClass: boolean;
  ageInvalid: boolean;
};

export function getReviewValidation(input: {
  hasChildId: boolean;
  hasDuplicateSelections: boolean;
  selectedItems: ReviewValidationItem[];
}) {
  const errors: string[] = [];

  if (!input.hasChildId) {
    errors.push("Missing child selection. Please go back and choose a child.");
  }

  if (input.selectedItems.length === 0) {
    errors.push("Select at least one class.");
  }

  if (input.hasDuplicateSelections) {
    errors.push("Duplicate class selections were detected and removed.");
  }

  const unavailableCount = input.selectedItems.filter(
    (item) => item.isUnavailable
  ).length;
  if (unavailableCount > 0) {
    errors.push(
      `${unavailableCount} selected ${
        unavailableCount === 1 ? "class is" : "classes are"
      } no longer available. Remove ${unavailableCount === 1 ? "it" : "them"} to continue.`
    );
  }

  const competitionCount = input.selectedItems.filter(
    (item) => item.isCompetitionClass
  ).length;
  if (competitionCount > 0) {
    errors.push(
      `${competitionCount} selected ${
        competitionCount === 1 ? "class is" : "classes are"
      } competition-only and cannot be booked here.`
    );
  }

  const ageInvalidCount = input.selectedItems.filter(
    (item) => item.ageInvalid
  ).length;
  if (ageInvalidCount > 0) {
    errors.push(
      `${ageInvalidCount} selected ${
        ageInvalidCount === 1 ? "class does" : "classes do"
      } not match this child's age requirements.`
    );
  }

  return {
    errors,
    canContinue:
      input.hasChildId &&
      input.selectedItems.length > 0 &&
      unavailableCount === 0 &&
      competitionCount === 0 &&
      ageInvalidCount === 0,
  };
}
