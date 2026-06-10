export type WorksheetQuestionType = "text" | "table" | "checkbox" | "short";

export type WorksheetQuestionText = {
  id: string;
  type: "text";
  label: string;
};

export type WorksheetQuestionTable = {
  id: string;
  type: "table";
  label: string;
  columns: string[];
  rows: string[];
};

export type WorksheetQuestionCheckbox = {
  id: string;
  type: "checkbox";
  label: string;
  options: string[];
};

export type WorksheetQuestionShort = {
  id: string;
  type: "short";
  label: string;
};

export type WorksheetQuestion =
  | WorksheetQuestionText
  | WorksheetQuestionTable
  | WorksheetQuestionCheckbox
  | WorksheetQuestionShort;

export type SectionResource = {
  name: string;
  url: string;
  mime_type: string;
};

export type WorksheetFaction = {
  id: string;
  name: string;
  color: string;
};

export type WorksheetSection = {
  id: string;
  title: string;
  description: string;
  questions: WorksheetQuestion[];
  /** Fichiers ressource communs à toutes les factions */
  resources?: SectionResource[];
  /** Fichiers ressource par faction : clé = faction_id, valeur = liste de fichiers */
  resourcesByFaction?: Record<string, SectionResource[]>;
};

export type Worksheet = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  sections: WorksheetSection[];
  created_at: string;
};

export type WorksheetInsert = Omit<Worksheet, "id" | "created_at">;
export type WorksheetUpdate = Partial<WorksheetInsert>;

export type AnswerValue = string | string[] | string[][];
export type WorksheetAnswers = Record<string, AnswerValue>;

export type WorksheetResponse = {
  id: string;
  worksheet_id: string;
  faction_id: string;
  respondent_firstname: string;
  respondent_lastname: string;
  answers: WorksheetAnswers;
  submitted_at: string;
};

export type WorksheetResponseInsert = Omit<WorksheetResponse, "id" | "submitted_at">;

export type WorksheetResponseWithFaction = WorksheetResponse & {
  faction: {
    id: string;
    name: string;
    color: string;
  };
};

export type WorksheetDraft = {
  worksheetId: string;
  answers: WorksheetAnswers;
  respondentFirstname: string;
  respondentLastname: string;
  factionId: string;
  currentSectionIndex: number;
};

/** Membre inscrit exposé au formulaire d'identification du worksheet */
export type WorksheetMember = {
  id: string;
  firstName: string;
  lastName: string;
  factionId: string;
};
