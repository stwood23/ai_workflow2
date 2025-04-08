<!-- # Implementation Plan

---

## Milestone 1: Prompt Creation & Optimization

- **Goal**: Users can create raw prompts, have them optimized by an LLM, auto-generate titles, store these prompts (with placeholders) in the DB, and list them in a `/prompts` page.

---

- [ ] **Step 1: Add Prompt Template DB Schema**
  - **Task**: Create a new `prompt_templates` table and add it to Drizzle schema for storing prompt templates.
    - Add `prompt-templates.ts` to `db/schema` and export from `db/schema/index.ts`.
    - Update `db/db.ts` schema object if needed.
  - **Files**:
    1. `db/schema/prompt-templates.ts`: Define the `promptTemplatesTable`.
    2. `db/schema/index.ts`: Export the new table.
    3. `db/db.ts`: Ensure the new table is added to the schema object if needed.
  - **Step Dependencies**: None (first DB step).
  - **User Instructions**:
    - After merging this step, run `npm run db:generate` and `npm run db:migrate` (or your Drizzle workflow) to apply the new table.

- [ ] **Step 2: Implement Prompt-Related Server Actions**
  - **Task**: Create a new `actions/db/prompts-actions.ts` file to handle CRUD for prompt templates. Must ensure user ownership checks.
    - Implement `createPromptTemplateAction`, `getPromptTemplatesAction`, `getPromptTemplateAction`, `updatePromptTemplateAction`, and `deletePromptTemplateAction`.
    - Return consistent `ActionState<T>` objects.
  - **Files**:
    1. `actions/db/prompts-actions.ts`: New file with all prompt-related DB actions.
    2. `types/index.ts` or `types/actions-types.ts`: Possibly update exports if needed.
  - **Step Dependencies**: Step 1 (schema).
  - **User Instructions**: No additional instructions, but ensure `.env.local` is set up for DB credentials.

- [ ] **Step 3: Implement LLM Integration & System Prompts**
  - **Task**:
    - Create `optimizePromptAction` and `generateTitleAction` in a new `actions/llm-actions.ts` or an existing LLM actions file.
    - Add text files (e.g., `prompts/optimize_prompt.txt`, `prompts/generate_title.txt`) or inline system prompt strings referencing placeholders.
    - Make sure environment variables for LLM (OpenAI, Anthropic, Grok) are noted in `.env.example`.
  - **Files**:
    1. `actions/llm-actions.ts`: Create or update with `optimizePromptAction` and `generateTitleAction`.
    2. `prompts/optimize_prompt.txt`: If storing system text externally.
    3. `prompts/generate_title.txt`: If storing system text externally.
    4. `types/index.ts`: Potentially add `llmProviderEnum` or re-export from schema if not done.
  - **Step Dependencies**: Step 2 (since we will likely store or retrieve prompt data).
  - **User Instructions**:
    - Add your LLM API keys (e.g., `OPENAI_API_KEY`) to `.env.local`.
    - Configure the environment variables for the chosen providers.

- [ ] **Step 4: Create `/prompts` Page & List View**
  - **Task**:
    - Add a protected route `app/(protected)/prompts/page.tsx` (server component) that calls `getPromptTemplatesAction` to list the user’s prompts.
    - Add a small client component `prompts-list.tsx` that displays prompt titles, default LLM, timestamps, etc.
  - **Files**:
    1. `app/(protected)/prompts/page.tsx`: Server page for listing prompts.
    2. `app/(protected)/prompts/_components/prompts-list.tsx`: Client or server component to render the table/list.
    3. `actions/db/prompts-actions.ts`: Slight updates to refine or fix retrieval calls.
  - **Step Dependencies**: Steps 2–3.
  - **User Instructions**: None.

- [ ] **Step 5: Implement “Create New Prompt” Modal & Optimization Flow**
  - **Task**:
    - Add a “Create New Prompt” button that opens a modal (`create-prompt-modal.tsx`).
    - Inside the modal: raw prompt input, “Optimize Prompt” calls `optimizePromptAction`, auto-fills an LLM-generated title via `generateTitleAction`.
    - “Save Prompt” calls `createPromptTemplateAction` and refreshes the list.
    - Include a default LLM selection dropdown.
  - **Files**:
    1. `app/(protected)/prompts/_components/create-prompt-button.tsx`: Button to open modal.
    2. `app/(protected)/prompts/_components/create-prompt-modal.tsx`: The dialog UI with form states.
    3. `actions/db/prompts-actions.ts`: Possibly minor refactor to unify creation logic with the new data structure (title, placeholders).
    4. `actions/llm-actions.ts`: Ensure correct usage for the “Optimize Prompt” step.
  - **Step Dependencies**: Steps 2–4.
  - **User Instructions**: None.
  - **Result**: **Milestone 1** is complete and fully functional.

---

## Milestone 2: Document Generation

- **Goal**: Generate documents using saved prompt templates, fill placeholders, override LLM if needed, and store the generated document in `/documents`.

---

- [ ] **Step 1: Add `documents` DB Schema**
  - **Task**: Create a new `documentsTable` in `db/schema/documents.ts`. Ensure we can optionally link to a `promptTemplateId`, store content, `llmProviderUsed`, etc.
  - **Files**:
    1. `db/schema/documents.ts`: New Drizzle table definition.
    2. `db/schema/index.ts`: Export the table.
    3. `db/db.ts`: Update schema object as needed.
  - **Step Dependencies**: Milestone 1 completed is recommended, but minimal direct code dependency on prompts.
  - **User Instructions**:
    - Run `npm run db:generate && npm run db:migrate` to apply the documents schema.

- [ ] **Step 2: Create Document Actions**
  - **Task**:
    - In `actions/db/documents-actions.ts`, add `createDocumentAction`, `getDocumentsAction`, `getDocumentAction`, `updateDocumentAction`, `deleteDocumentAction`.
    - Each action ensures user ownership checks (`where eq(documentsTable.userId, userId)`).
  - **Files**:
    1. `actions/db/documents-actions.ts`: New file for documents CRUD.
    2. `types/index.ts`: Export any new types if needed.
  - **Step Dependencies**: Step 1 of Milestone 2.

- [ ] **Step 3: Implement `generateDocumentAction` with Placeholder Replacement**
  - **Task**:
    - In `actions/llm-actions.ts`, create a `generateDocumentAction(...)` that:
      1. Fetches the prompt template by ID.
      2. Replaces `{{placeholders}}` with user-provided input.
      3. Calls the chosen LLM to generate text.
      4. Saves a new document record via `createDocumentAction`.
    - Optionally store generation metadata (prompt used, tokens, etc.) in JSON.
  - **Files**:
    1. `actions/llm-actions.ts`: Add `generateDocumentAction`.
    2. `actions/db/documents-actions.ts`: Possibly reference or refine create logic.
  - **Step Dependencies**: Steps 1–2 (since we must save a new document to the DB).
  - **User Instructions**: Verify your LLM environment variables are set.

- [ ] **Step 4: Create `/documents` Page & Document Listing**
  - **Task**:
    - Add a new route `app/(protected)/documents/page.tsx` to list existing documents.
    - A table or grid view showing doc title, timestamp, prompt used.
    - Add a “Generate Document” button or link to open a generation modal.
  - **Files**:
    1. `app/(protected)/documents/page.tsx`: Server component to fetch and display documents.
    2. `app/(protected)/documents/_components/documents-list.tsx`: Renders the list.
    3. `actions/db/documents-actions.ts`: Ensure `getDocumentsAction` is correct.
  - **Step Dependencies**: Steps 1–3.

- [ ] **Step 5: Implement Document Generation Modal & One-Click from Prompts**
  - **Task**:
    - Create a modal to choose an existing prompt, fill placeholders, optionally override the default LLM, and call `generateDocumentAction`.
    - Add a “Generate Document” button on the prompt list so a user can jump directly to the document generation flow with that prompt preselected.
  - **Files**:
    1. `app/(protected)/documents/_components/generate-document-modal.tsx`: The form for picking prompt & placeholders.
    2. `app/(protected)/prompts/_components/prompts-list.tsx`: Add “Generate Document” action or link for each prompt row.
    3. `actions/llm-actions.ts`: Possibly refine `generateDocumentAction` to handle LLM override.
  - **Step Dependencies**: Steps 1–4.
  - **User Instructions**: None.
  - **Result**: **Milestone 2** is complete and tested.

---

## Milestone 3: Context Snippet Management

- **Goal**: Users can create reusable text snippets. Instead of storing snippet text in the prompt, we only store placeholders like `@company-info`, which are substituted at generation time.

---

- [ ] **Step 1: Add `context_snippets` DB Schema**
  - **Task**:
    - Create a new `context_snippets` table with fields `(id, userId, name, content)`, ensuring `name` is unique per user.
    - Export from `db/schema/index.ts`.
  - **Files**:
    1. `db/schema/context-snippets.ts`: New table definition.
    2. `db/schema/index.ts`: Add export.
    3. `db/db.ts`: Possibly add to the schema object.
  - **Step Dependencies**: None, but recommended after basic DB knowledge from earlier milestones.
  - **User Instructions**: Migrate DB.

- [ ] **Step 2: Create Context Snippet Actions**
  - **Task**:
    - In `actions/db/context-snippets-actions.ts`, implement `createContextSnippetAction`, `getContextSnippetsAction`, `getContextSnippetByNameAction`, `updateContextSnippetAction`, `deleteContextSnippetAction`.
    - Filter by `userId`.
  - **Files**:
    1. `actions/db/context-snippets-actions.ts`: New file with snippet CRUD actions.
    2. `types/index.ts`: Add exports if needed.
  - **Step Dependencies**: Step 1 of Milestone 3.

- [ ] **Step 3: Parse & Inject Snippets in `generateDocumentAction`**
  - **Task**:
    - Update `generateDocumentAction` to detect snippet placeholders like `@(\w+)`, fetch each snippet by name, and replace them with the snippet’s current content.
    - Ensure placeholders `@company-info` remain fully dynamic (always load latest snippet text).
  - **Files**:
    1. `actions/llm-actions.ts`: Modify `generateDocumentAction` to handle snippet injection before calling the LLM.
    2. `actions/db/context-snippets-actions.ts`: Possibly refine to handle batch or repeated snippet fetch.
  - **Step Dependencies**: Steps 1–2, plus `generateDocumentAction` from Milestone 2.

- [ ] **Step 4: Create `/context` Page & Snippet CRUD UI**
  - **Task**:
    - Add `app/(protected)/context/page.tsx` listing all context snippets.
    - A “Create Snippet” button to open a modal for `name` and `content`.
    - Possibly allow inline editing or a dedicated edit page.
  - **Files**:
    1. `app/(protected)/context/page.tsx`: Server page to fetch and display snippets.
    2. `app/(protected)/context/_components/snippets-list.tsx`: Renders snippet list.
    3. `app/(protected)/context/_components/create-snippet-modal.tsx`: Modal for snippet creation.
    4. `actions/db/context-snippets-actions.ts`: Tied to fetching/creating/deleting snippets for the UI.
  - **Step Dependencies**: Steps 1–3.

- [ ] **Step 5: Hover Preview for Snippet Placeholders**
  - **Task**:
    - Use a small popover or tooltip in any UI where `@snippet` references appear (like in a prompt listing) to show snippet content or summary on hover.
    - If feasible, link to “Edit Snippet”.
  - **Files**:
    1. `app/(protected)/prompts/_components/prompts-list.tsx`: Possibly parse references or highlight them.
    2. `components/ui/tooltip.tsx` or `popover.tsx`: Make a small utility for snippet hover preview.
  - **Step Dependencies**: Steps 1–4.
  - **Result**: **Milestone 3** complete. Snippets are stored, managed, and dynamically inserted during document generation.

---

## Milestone 4: Real-Time Document Editing via AI Chat

- **Goal**: After generating a document, user can open it in an editor that includes a chat-like interface. Commands to the AI (e.g., “Remove the last section”) automatically adjust the text in real time.

---

- [ ] **Step 1: Enhance `documents` Table (If Needed) & Prepare Editor Page**
  - **Task**:
    - Confirm existing `documentsTable` can store the final content. If no changes needed, skip the DB update.
    - Create a new route `app/(protected)/documents/[documentId]/edit/page.tsx` that fetches the doc with `getDocumentAction`.
  - **Files**:
    1. `app/(protected)/documents/[documentId]/edit/page.tsx`: Server page to load a single doc.
    2. `db/schema/documents.ts`: Only if we need an extra field for chat logs or we confirm no changes needed.
  - **Step Dependencies**: Milestones 1–3 are recommended, but no direct code dependency.

- [ ] **Step 2: Add Document Editor & Chat Sidebar Components**
  - **Task**:
    - Create `document-editor.tsx` (client) to show the doc text in an editable area.
    - Create `chat-sidebar.tsx` with a small input for user commands, plus a chat history region for AI responses.
  - **Files**:
    1. `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: The main text editing UI.
    2. `app/(protected)/documents/[documentId]/edit/_components/chat-sidebar.tsx`: The chat interface.
  - **Step Dependencies**: Step 1 of Milestone 4.

- [ ] **Step 3: Implement `editDocumentViaChatAction`**
  - **Task**:
    - In `actions/llm-actions.ts`, add a function that takes current doc content + user “command,” calls the LLM with an “edit prompt,” returns updated text.
    - The client then merges the new content into the editor’s state.
  - **Files**:
    1. `actions/llm-actions.ts`: Add `editDocumentViaChatAction({ documentId, currentContent, command, userId })`.
    2. `app/(protected)/documents/[documentId]/edit/_components/chat-sidebar.tsx`: Call the above on user command submit.
  - **Step Dependencies**: Steps 1–2 of Milestone 4.

- [ ] **Step 4: Real-Time Updates & Saving Document Changes**
  - **Task**:
    - Ensure the updated content from the chat is instantly reflected in `document-editor.tsx`.
    - Add a “Save” or “Auto-Save” mechanism that calls `updateDocumentAction` with the new content.
  - **Files**:
    1. `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: Add prop or context method to set text from chat.
    2. `actions/db/documents-actions.ts`: Possibly refine `updateDocumentAction`.
    3. `app/(protected)/documents/[documentId]/edit/page.tsx`: Decide if we do an auto-save or a manual save button.
  - **Step Dependencies**: Steps 1–3 of Milestone 4.
  - **Result**: **Milestone 4** complete. Users can refine documents with AI commands in real time.

---

## Milestone 5: AI-Powered Prompt Improvement via Diff Comparison

- **Goal**: After editing a generated document, the system suggests how to adjust the *original prompt template* so future generations are closer to the final edited doc.

---

- [ ] **Step 1: Add `suggestPromptImprovementAction`**
  - **Task**:
    - In `actions/llm-actions.ts`, create `suggestPromptImprovementAction({ originalPrompt, finalDocumentContent, userId })`.
    - This calls the LLM with the original prompt and final doc, returning a recommended updated prompt text.
    - Emphasize preserving placeholders in the system prompt.
  - **Files**:
    1. `actions/llm-actions.ts`: Implement `suggestPromptImprovementAction`.
  - **Step Dependencies**: Milestone 4 done (we now have final doc content).
  - **User Instructions**: Ensure LLM keys are still valid.

- [ ] **Step 2: Show Prompt Improvement Modal**
  - **Task**:
    - After user finalizes doc (or clicks “Copy”/“Save”), open a modal showing the recommended changes.
    - Provide a side-by-side or inline diff highlighting changes to the prompt.
    - Buttons: “Accept & Overwrite” or “Save as New Prompt,” or “Dismiss.”
  - **Files**:
    1. `app/(protected)/documents/[documentId]/edit/_components/prompt-improvement-modal.tsx`: The UI for showing the updated prompt suggestion.
    2. `actions/db/prompts-actions.ts`: Possibly for “accept & overwrite” or “save as new prompt.”
  - **Step Dependencies**: Step 1 of Milestone 5, plus a working doc editor from Milestone 4.

- [ ] **Step 3: Overwrite / Create New Prompt Logic**
  - **Task**:
    - In the modal, “Accept & Overwrite” calls `updatePromptTemplateAction`.
    - “Save as New Prompt” calls `createPromptTemplateAction`.
  - **Files**:
    1. `app/(protected)/documents/[documentId]/edit/_components/prompt-improvement-modal.tsx`: Wire up button calls to the server actions.
    2. `actions/db/prompts-actions.ts`: Already has `updatePromptTemplateAction`, `createPromptTemplateAction`.
  - **Step Dependencies**: Steps 1–2 of Milestone 5.
  - **Result**: **Milestone 5** complete. The system can automatically refine prompt templates based on final doc edits.

---

## Milestone 6: Workflow Automation

- **Goal**: Let users chain multiple prompt templates into a workflow, with outputs from one step feeding the next. Provide a visual editor, workflow runs, and instance tracking.

---

- [ ] **Step 1: Add `workflow_templates` & `workflow_instances` DB Schemas**
  - **Task**:
    - Create `workflow_templatesTable` and `workflow_instancesTable` with JSONB `nodes`, `edges`, plus `nodeStatuses`.
    - Link instance to a template, store `initialInputs`.
  - **Files**:
    1. `db/schema/workflow-templates.ts`: Table for storing the workflow design (nodes, edges).
    2. `db/schema/workflow-instances.ts`: Table for each run instance, status, node statuses.
    3. `db/schema/index.ts`: Export new tables.
    4. `db/db.ts`: Update schema object if needed.
  - **Step Dependencies**: None, but recommended after prior DB patterns.
  - **User Instructions**: `npm run db:generate && npm run db:migrate`.

- [ ] **Step 2: Create Workflow Template Actions**
  - **Task**:
    - `createWorkflowTemplateAction`, `getWorkflowTemplatesAction`, `updateWorkflowTemplateAction`, `deleteWorkflowTemplateAction`.
    - Store node details in JSON, including references to prompt template IDs.
  - **Files**:
    1. `actions/db/workflow-templates-actions.ts`: New file for the DB actions.
    2. `types/workflow-types.ts` (optional) for node/edge shape definitions.
  - **Step Dependencies**: Step 1 of Milestone 6.

- [ ] **Step 3: Create Workflow Instance Actions & Execution Logic**
  - **Task**:
    - `createWorkflowInstanceAction` to start a run from a given template, storing `initialInputs` in `workflow_instances`.
    - `runWorkflowInstanceAction` or sequential logic: iterate nodes in order, calling `generateDocumentAction` for each node. Store resulting doc ID in `nodeStatuses`.
  - **Files**:
    1. `actions/db/workflow-instances-actions.ts`: CRUD for instances.
    2. `actions/workflow-actions.ts`: High-level orchestration `runWorkflowInstanceAction`.
    3. `actions/llm-actions.ts`: Possibly reference `generateDocumentAction` in the chain.
  - **Step Dependencies**: Steps 1–2 of Milestone 6, plus documents generation from Milestone 2.

- [ ] **Step 4: Workflow UI - Template Editor Page**
  - **Task**:
    - Create `app/(protected)/workflows/new/page.tsx` and `app/(protected)/workflows/[templateId]/edit/page.tsx` with a full-page drag-and-drop or list-based editor to define nodes, edges.
    - Save to DB with `createWorkflowTemplateAction` or `updateWorkflowTemplateAction`.
  - **Files**:
    1. `app/(protected)/workflows/new/page.tsx`: New template creation.
    2. `app/(protected)/workflows/[templateId]/edit/page.tsx`: Editing an existing template.
    3. `app/(protected)/workflows/_components/workflow-editor.tsx`: The actual editor component (client).
  - **Step Dependencies**: Steps 1–3 of Milestone 6.

- [ ] **Step 5: Workflow Execution & Instance Views**
  - **Task**:
    - Add `app/(protected)/workflows/[templateId]/run/page.tsx` to gather initial placeholders and create a new instance. Then automatically start.
    - Add `app/(protected)/workflows/instances/[instanceId]/page.tsx` to show real-time progress (polling or SSE).
    - Display docs generated at each node with links to edit them.
  - **Files**:
    1. `app/(protected)/workflows/[templateId]/run/page.tsx`: Starting a run and capturing placeholders.
    2. `app/(protected)/workflows/instances/[instanceId]/page.tsx`: Real-time view of the run’s progress.
    3. `actions/workflow-actions.ts`: Possibly update to handle polling or node-by-node logic.
  - **Step Dependencies**: Steps 1–4 of Milestone 6 (for UI).
  - **Result**: **Milestone 6** done. Users can build, run, and track multi-step workflows.

---

## Summary

This plan breaks the application into six milestones reflecting the specification’s features:
1. **Prompt Creation/Optimization**
2. **Document Generation**
3. **Context Snippets**
4. **Real-Time Editing**
5. **Prompt Improvement**
6. **Workflow Automation**

Each milestone is divided into small, focused steps so the code generation system can implement them incrementally without exceeding file-change limits. After completing all milestones in order, the application will provide a robust AI-driven workflow builder, including prompt templates, snippet management, multi-step workflows, and sophisticated real-time editing with dynamic prompt refinement. -->
