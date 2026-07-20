/** Shared server-action result shape for form state (R11). */
export interface ActionState {
  ok?: boolean;
  errors?: Record<string, string>;
}

export const initialActionState: ActionState = {};

/** Generic, non-technical failure message (no internals leaked). */
export const GENERIC_ERROR: ActionState = {
  errors: { _form: "Something went wrong. Your data was not changed — please retry." },
};
