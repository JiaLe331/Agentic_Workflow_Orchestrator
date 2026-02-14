# Onboarding Workflow Rules

This document defines the rules for managing candidate stages in the `onboarding` table in Supabase. Agents should refer to this file when determining how to move candidates between stages.

## Table Structure

**Table Name:** `onboarding`

### Key Columns
- `id`: Unique identifier (UUID).
- `name`: Candidate's full name.
- `interview_stage`: Integer representing the current stage of the candidate.
- `technical_assessment`: Boolean flag (optional/secondary).
- `onboarded`: Boolean flag (optional/secondary).
- `passed`: Boolean flag (indicates if they passed the previous stage).

## Stage Mapping

The application groups candidates into three main columns based on the `interview_stage` value. To move a candidate, update the `interview_stage` column to the corresponding integer value.

| Board Column | Specific Stage Name | `interview_stage` Value | Description |
| :--- | :--- | :--- | :--- |
| **Interview Stage** | HR Screening | `1` | Initial screening by HR. |
| **Interview Stage** | Manager Interview | `2` | Interview with the hiring manager. |
| **Technical Assessment** | Take-home Assignment | `3` | Candidate is working on a take-home task. |
| **Technical Assessment** | Technical Review | `4` | Code or task is being reviewed by engineers. |
| **Onboarded** | Onboarding Completed | `5` | Candidate has been successfully hired and onboarded. |

## Transition Rules

### 1. Moving to Interview Stage
To move a candidate to the **Interview Stage** column:
- **Action**: Update `interview_stage` to `1` or `2`.
- **Example SQL**:
  ```sql
  UPDATE onboarding SET interview_stage = 2 WHERE name = 'Ben';
  ```

### 2. Moving to Technical Assessment
To move a candidate to the **Technical Assessment** column:
- **Action**: Update `interview_stage` to `3` or `4`.
- **Example SQL**:
  ```sql
  UPDATE onboarding SET interview_stage = 4 WHERE name = 'Ben';
  ```

### 3. Moving to Onboarded
To move a candidate to the **Onboarding Completed** column:
- **Action**: Update `interview_stage` to `5` (or higher).
- **Secondary Action (Recommended)**: Set `onboarded` to `true`.
- **Example SQL**:
  ```sql
  UPDATE onboarding SET interview_stage = 5, onboarded = true WHERE name = 'Ben';
  ```

### 4. Removing a Candidate
To remove a candidate from the board entirely (e.g., rejected or withdrawn):
- **Action**: Delete the row.
- **Example SQL**:
  ```sql
  DELETE FROM onboarding WHERE name = 'Ben';
  ```

## UI Logic Reference
The frontend application filters candidates using the following logic:
- `Interview Stage`: `interview_stage === 1 || interview_stage === 2`
- `Technical Assessment`: `interview_stage === 3 || interview_stage === 4`
- `Onboarded`: `interview_stage >= 5`
