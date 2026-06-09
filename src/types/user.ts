export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  faction_id: string | null;
  created_at: string;
};

export type UserWithFaction = User & {
  faction: {
    id: string;
    name: string;
    color: string;
  } | null;
};

export type UserInsert = {
  first_name: string;
  last_name: string;
  email: string;
  faction_id: string | null;
};

export type UserUpdate = Partial<UserInsert>;

/** One row parsed from an imported file (JSON / CSV / XLSX) */
export type ImportRow = {
  first_name: string;
  last_name: string;
  email: string;
  faction_id: string | null;
  /** Original line/row index in the file (1-based) */
  rowIndex: number;
};

/** An entry that conflicts with an existing user in the DB */
export type DuplicateConflict = {
  incoming: ImportRow;
  existing: UserWithFaction;
};

/** Result returned by the import API endpoint */
export type ImportApiResult = {
  inserted: number;
  duplicates: DuplicateConflict[];
};

/** Resolution chosen by the admin for each duplicate */
export type DuplicateResolution = {
  email: string;
  action: "replace" | "ignore";
};

/** Errors found while parsing the uploaded file */
export type ParseError = {
  rowIndex: number;
  field: string;
  message: string;
};

/** Full result of client-side file parsing */
export type ParsedFileResult = {
  rows: ImportRow[];
  errors: ParseError[];
};

/** Paginated list response */
export type PaginatedUsers = {
  data: UserWithFaction[];
  total: number;
  page: number;
  pageSize: number;
};

/** Payload for bulk delete action */
export type BulkDeletePayload = {
  action: "delete";
  ids: string[];
};

/** Payload for bulk faction reassign action */
export type BulkReassignPayload = {
  action: "reassign";
  ids: string[];
  faction_id: string | null;
};

/** Union of all bulk action payloads */
export type BulkUsersPayload = BulkDeletePayload | BulkReassignPayload;

/** Result returned by the bulk action API endpoint */
export type BulkUsersResult = {
  affected: number;
};
