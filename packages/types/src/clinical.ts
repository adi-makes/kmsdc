/** FDI two-digit notation (ISO 3950) */
export const PERMANENT_TEETH_FDI = [
  // Upper right (quadrant 1)
  '18',
  '17',
  '16',
  '15',
  '14',
  '13',
  '12',
  '11',
  // Upper left (quadrant 2)
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  // Lower left (quadrant 3)
  '38',
  '37',
  '36',
  '35',
  '34',
  '33',
  '32',
  '31',
  // Lower right (quadrant 4)
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
] as const;

export const PRIMARY_TEETH_FDI = [
  // Upper right (quadrant 5)
  '55',
  '54',
  '53',
  '52',
  '51',
  // Upper left (quadrant 6)
  '61',
  '62',
  '63',
  '64',
  '65',
  // Lower left (quadrant 7)
  '75',
  '74',
  '73',
  '72',
  '71',
  // Lower right (quadrant 8)
  '81',
  '82',
  '83',
  '84',
  '85',
] as const;

export const ALL_TEETH_FDI = [...PERMANENT_TEETH_FDI, ...PRIMARY_TEETH_FDI] as const;
export type ToothFdi = (typeof ALL_TEETH_FDI)[number];

export const TOOTH_SURFACES = [
  'M', // Mesial
  'D', // Distal
  'O', // Occlusal
  'I', // Incisal
  'B', // Buccal
  'F', // Facial/Labial
  'L', // Lingual
  'P', // Palatal
] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];

export const TOOTH_CONDITIONS = [
  'CARIES',
  'RESTORATION',
  'MISSING',
  'EXTRACTED',
  'EXTRACTION_PLANNED',
  'ROOT_CANAL_TREATED',
  'CROWN',
  'BRIDGE_ABUTMENT',
  'BRIDGE_PONTIC',
  'IMPLANT',
  'FRACTURE',
  'SEALANT',
  'IMPACTED',
  'UNERUPTED',
  'MOBILITY',
  'OTHER',
] as const;
export type ToothConditionType = (typeof TOOTH_CONDITIONS)[number];

export const TOOTH_CONDITION_STATUSES = ['EXISTING', 'PLANNED', 'COMPLETED'] as const;
export type ToothConditionStatus = (typeof TOOTH_CONDITION_STATUSES)[number];

export const CLINICAL_NOTE_STATUSES = ['DRAFT', 'FINALISED', 'AMENDED'] as const;
export type ClinicalNoteStatus = (typeof CLINICAL_NOTE_STATUSES)[number];

export const TREATMENT_PLAN_STATUSES = [
  'DRAFT',
  'PROPOSED',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
] as const;
export type TreatmentPlanStatus = (typeof TREATMENT_PLAN_STATUSES)[number];

export const TREATMENT_ITEM_STATUSES = [
  'PROPOSED',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type TreatmentItemStatus = (typeof TREATMENT_ITEM_STATUSES)[number];
