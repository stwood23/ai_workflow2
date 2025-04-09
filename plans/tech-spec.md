# AI Workflow Builder Technical Specification

## 1. System Overview
- **Core purpose and value proposition:**
  An AI-powered platform enabling users to create, manage, and execute multi-step content generation workflows using customizable prompt templates, context snippets, and various LLM providers. It aims to streamline repetitive content creation tasks through automation and AI assistance.
- **Key workflows:**
    1. Prompt Template Creation & Optimization
    2. Document Generation from Templates (with placeholder injection)
    3. Context Snippet Management & Dynamic Injection
    4. Real-time Document Editing Manually and via AI Chat
    5. AI-Assisted Prompt Template Improvement
    6. Workflow Template Creation & Execution (Chaining Prompts)
    7. User Authentication & Authorization
    8. Analytics Tracking (User Behavior)
- **System architecture:**
    - **Frontend:**
        - Next.js 14+ (App Router), React 18+, TypeScript
        - Tailwind CSS, Shadcn UI, Framer Motion, `lucide-react`
        - Primarily Server Components with Client Components for interactivity.
    - **Backend:**
        - Node.js (via Next.js Server Actions/Route Handlers).
        - Supabase (PostgreSQL).
        - Drizzle ORM.
    - **Authentication:** Clerk.
    - **Analytics:** PostHog.
    - **Deployment:** Vercel.
    - **LLM Providers:** OpenAI, Anthropic, Grok (via API integrations).

## 2. Project Structure
- Adheres to `.cursorrules`, utilizing a standard Next.js App Router structure:
    - `actions/`: Server Actions.
        - `db/`: Database-specific actions (e.g., `prompts-actions.ts`, `documents-actions.ts`). Organized by schema. CRUD order within files.
        - `index.ts`: Root actions (e.g., `llm-actions.ts`, `workflow-actions.ts`).
    - `app/`: Next.js App Router.
        - `(auth)/`: Clerk authentication routes (sign-in, sign-up).
        - `(protected)/`: Authenticated application routes.
            - `layout.tsx`: Main layout with Sidebar, Clerk provider, PostHog provider.
            - `prompts/`: Prompt template management section.
                - `page.tsx`: List prompts.
                - `[promptId]/page.tsx`: View/Edit prompt details (TBD if needed).
                - `_components/`: Prompt-specific components (e.g., `create-prompt-modal.tsx`, `prompts-list.tsx`).
            - `documents/`: Document management section.
                - `page.tsx`: List documents.
                - `[documentId]/edit/page.tsx`: Edit document manually or Real-time via AI chat editor.
                - `_components/`: Document-specific components (e.g., `generate-document-modal.tsx`, `document-editor.tsx`, `chat-sidebar.tsx`).
            - `context/`: Context snippet management.
                - `page.tsx`: List snippets.
                - `[snippetId]/edit/page.tsx`: Edit the snippet.
                - `_components/`: Snippet-specific components (e.g., `create-snippet-modal.tsx`, `snippets-list.tsx`).
            - `workflows/`: Workflow management.
                - `page.tsx`: List workflow templates and instances.
                - `new/page.tsx`: Full-page workflow template editor.
                - `[templateId]/edit/page.tsx`: Full-page workflow template editor (edit mode).
                - `[templateId]/run/page.tsx`: Initiate workflow instance run.
                - `instances/[instanceId]/page.tsx`: View workflow instance progress/results.
                - `_components/`: Workflow-specific components (e.g., `workflow-editor.tsx`, `workflow-instance-view.tsx`, `workflow-templates-list.tsx`).
            - `settings/`: User settings.
        - `api/`: API Route Handlers.
        - `layout.tsx`: Root layout (Clerk provider, PostHog provider).
        - `global.css`: Tailwind base styles.
    - `components/`: Shared components.
        - `ui/`: Core UI elements (mostly Shadcn, potentially customized).
        - `utilities/`: Utility components (e.g., `loading-spinner.tsx`, `skeleton-loader.tsx`, `page-header.tsx`, `sidebar.tsx`).
    - `db/`: Database configuration and schemas.
        - `db.ts`: Drizzle client instance and schema object.
        - `schema/`: Drizzle schema definitions (`*.ts` files).
            - `index.ts`: Exports all schemas.
            - `enums.ts`: Shared enums like `llmProviderEnum`.
            - `users.ts`: Potentially Clerk user sync or related data.
            - `prompt-templates.ts`
            - `documents.ts`
            - `context-snippets.ts`
            - `workflow-templates.ts`
            - `workflow-instances.ts`
        - `migrations/`: Drizzle migrations (ignored per rules, but directory exists).
    - `lib/`: Library code.
        - `utils.ts`: General utility functions (e.g., `cn` from Shadcn).
        - `hooks/`: Custom React hooks (if needed).
        - `constants.ts`: Application constants.
        - `llm.ts`: Abstraction layer for interacting with different LLM APIs.
          // TODO: Implement support for Anthropic and Grok APIs, including SDK/fetch logic and API key handling (ANTHROPIC_API_KEY, GROK_API_KEY).
        - `posthog.ts`: PostHog client instance helper (if needed beyond provider).
    - `prompts/`: Text files containing system prompts for LLM interactions (e.g., `optimize_prompt.txt`, `generate_title.txt`).
    - `public/`: Static assets (images, fonts if not using CDN).
    - `types/`: TypeScript interfaces and types.
        - `index.ts`: Exports all types.
        - `actions-types.ts`: `ActionState<T>`.
        - `db-types.ts`: Types inferred from Drizzle schemas (e.g., `SelectPromptTemplate`, `InsertDocument`). These are generally imported directly from the schema files (`@/db/schema`).
        - `llm-types.ts`: Types for LLM interactions.
        - `workflow-types.ts`: Types for workflow node structures, etc.
    - `.env.local`: Local environment variables (Clerk, Supabase, PostHog, LLM keys).
    - `.env.example`: Example environment variables.
    - `.cursorrules`: Project rules.
    - `components.json`: Shadcn UI configuration.
    - `drizzle.config.ts`: Drizzle configuration.
    - `middleware.ts`: Clerk authentication middleware (assumed pre-configured).
    - `next.config.mjs`: Next.js configuration.
    - `package.json`: Project dependencies.
    - `tsconfig.json`: TypeScript configuration.
    - `tailwind.config.ts`: Tailwind CSS configuration.

## 3. Feature Specification

### 3.1 Prompt Template Management (Milestone 1)
- **User Story:** As a user, I want to create, optimize, and save reusable prompt templates with placeholders, specify a default LLM for generation, and have them automatically named, so I can efficiently generate consistent content later.
- **Requirements:**
    - `/prompts` page displays a list of existing prompt templates (title, timestamp, preview of prompt, default LLM).
    - "Create a New Prompt" button opens a modal.
    - Modal includes:
        - Textarea for raw prompt input (supports `{{placeholder}}`).
        - Button "Optimize Prompt"
        - Display area for LLM-optimized prompt (editable).
        - Input field for prompt title (auto-filled by LLM after optimization, editable).
        - Dropdown to select default LLM provider (OpenAI, Anthropic, Grok).
        - "Save Prompt" button.
        - "Cancel" button.
- **Implementation Steps:**
    1.  **Page (`/prompts/page.tsx`):** Server component, uses Suspense. Fetches prompts using `getPromptTemplatesAction`. Renders `PromptsList` and `CreatePromptButton`.
    2.  **List (`prompts-list.tsx`):** Server/Client component displaying prompts using a responsive grid of **cards**. Each card should show title, default LLM, timestamp, and actions (e.g., Generate Document, Edit, Delete).
    3.  **Button (`create-prompt-button.tsx`):** Client component triggering the modal.
    4.  **Modal (`create-prompt-modal.tsx`):** Client component using Shadcn Dialog. Manages form state (e.g., `react-hook-form`).
        - On "Optimize Prompt" click: Calls `optimizePromptAction` (passes raw prompt). Displays loading state. Updates optimized prompt area and calls `generateTitleAction` (passes raw prompt) to auto-fill title.
        - On "Save Prompt" click: Calls `createPromptAction` (passes final optimized prompt, title, selected LLM, `userId`). Closes modal and potentially refreshes the list (e.g., using `router.refresh()` or state update).
    5.  **Actions (`llm-actions.ts`, `prompts-actions.ts`):**
        - `optimizePromptAction(rawPrompt: string): Promise<ActionState<string>>`: Calls LLM API with optimization system prompt.
        - `generateTitleAction(rawPrompt: string): Promise<ActionState<string>>`: Calls LLM API with title generation system prompt.
        - `createPromptAction(data: InsertPromptTemplate): Promise<ActionState<SelectPromptTemplate>>`: Inserts into `prompt_templates` table, checks `userId`.
        - `getPromptTemplatesAction(userId: string): Promise<ActionState<SelectPromptTemplate[]>>`: Fetches prompts for the user.
- **Error Handling & Edge Cases:**
    - Display toasts/messages for failed LLM calls or DB operations using `ActionState`. Handle empty list state on the page. Validate inputs.
    - **Invalid Placeholder Formats:** If the user enters incorrectly formatted placeholders (e.g., `{placeholder}`), warn or highlight them during input or before saving.
    - **LLM Failures:** If optimization or title generation fails, display an error toast/message. Allow the user to retry the LLM call or save the prompt with the raw text and manually enter a title.
    - **Ownership Enforcement:** Database queries and actions MUST filter by `userId` to ensure users only see and modify their own templates.

### 3.2 Document Generation (Milestone 2)
- **User Story:** As a user, I want to generate documents using my saved prompt templates, provide specific inputs for placeholders, choose or override the LLM, and then view, edit, save, copy, or download the result.
- **Requirements:**
    - `/documents` page displays a list of generated documents (title, timestamp, prompt used).
    - "Generate Document" button opens a modal.
    - Direct "Generate Document" button on prompt list/view links to generation flow with prompt pre-selected.
    - Generation Modal:
        - Dropdown to select a prompt template. With an option to "create new prompt"
        - Displays the template's default LLM, allows selecting a different one for this run. Option to "Update Prompt's Default LLM".
        - User will fill in input fields for each `{{placeholder}}` found in the selected template.
        - "Generate" button.
    - Document View (after generation or opening existing):
        - Displays generated content in a readable/editable area.
        - Buttons: "Save", "Copy", "Download".
- **Implementation Steps:**
    1.  **Page (`/documents/page.tsx`):** Server component, uses Suspense. Fetches documents using `getDocumentsAction`. Renders `DocumentsList` and `GenerateDocumentButton`.
    2.  **List (`documents-list.tsx`):** Displays documents in a `DataTable`. Links to view/edit page (`/documents/[documentId]/edit`).
    3.  **Button (`generate-document-button.tsx`):** Client component triggering the modal.
    4.  **Modal (`generate-document-modal.tsx`):** Client component.
        - Fetches prompt templates for dropdown (`getPromptTemplatesAction`).
        - On prompt selection: Parses template for `{{placeholders}}`, displays corresponding input fields. Shows default LLM.
        - On "Generate" click: Calls `generateDocumentAction` (passes template ID, placeholder values, selected LLM, `userId`). Shows loading state. On success, potentially navigates to the document edit page or displays result in modal initially.
        - Logic for "Update Prompt's Default LLM" checkbox/button calls `updatePromptTemplateAction`.
    5.  **View/Edit Page (`/documents/[documentId]/edit/page.tsx`):** Combines viewing and editing (details in M4). Initially loads document content via `getDocumentAction`.
    6.  **Actions:**
        - `generateDocumentAction(data: { promptTemplateId: string; inputs: Record<string, string>; llmProvider: LlmProviderEnum; userId: string; }): Promise<ActionState<SelectDocument>>`: Fetches template, replaces placeholders, calls LLM API (`llm-actions.ts`), saves result to `documents` table.
        - `getDocumentsAction(userId: string): Promise<ActionState<SelectDocument[]>>`: Fetches documents for the user.
        - `getDocumentAction(id: string, userId: string): Promise<ActionState<SelectDocument>>`: Fetches a single document.
        - `updateDocumentAction(id: string, data: Partial<InsertDocument>, userId: string): Promise<ActionState<SelectDocument>>`: Updates document content (used after editing).
        - `updatePromptTemplateAction` (in `prompts-actions.ts`): Update default LLM.
- **Error Handling & Edge Cases:**
    - Handle LLM failures during generation (show error, allow retry).
    - **Missing Placeholder Input:** If a required `{{placeholder}}` is not filled by the user, prompt them to fill it before allowing generation, or define a default empty string behavior if appropriate.
    - Gracefully handle missing prompts (e.g., if a template was deleted after being selected). Show loading states during generation.
    - **LLM Timeout:** Use loading indicators (spinners/skeletons). If an LLM call times out, inform the user and provide a retry option.
    - **Ownership Enforcement:** Ensure users can only generate from their own prompts and view/edit their own documents.

### 3.3 Context Snippet Management (Milestone 3)
- **User Story:** As a user, I want to create, manage, and reuse snippets of context (like @company-info) so that my prompts can dynamically include up-to-date information at generation time without storing it directly in the template.
- **Requirements:**
    - `/context` page lists snippets (name, summary, created/updated).
    - "Create Context Snippet" button opens a modal.
    - Modal: Input for name (e.g., `@company-info`), Textarea for content. Save/Cancel buttons. CRUD operations.
    - Snippets referenced in prompts via `@name`.
    - During document generation (M2), `@name` placeholders are replaced server-side with the *current* snippet content before calling the LLM.
    - Hovering over `@name` in UI (e.g., prompt editor, document view) shows a tooltip/popover with snippet summary and potentially an edit link.
- **Implementation Steps:**
    1.  **Page (`/context/page.tsx`):** Server component, uses Suspense. Fetches snippets using `getContextSnippetsAction`. Renders `SnippetsList` and `CreateSnippetButton`.
    2.  **List (`snippets-list.tsx`):** Displays snippets, includes Edit/Delete buttons calling respective actions via modals/confirmations.
    3.  **Button (`create-snippet-button.tsx`):** Client component triggering the modal.
    4.  **Modal (`create-edit-snippet-modal.tsx`):** Client component for creating/editing snippets. Calls `createContextSnippetAction` or `updateContextSnippetAction`.
    5.  **Generation Logic (`llm-actions.ts`/`generateDocumentAction`):** Before sending prompt to LLM, parse for `@(\w+)` patterns. For each match, fetch the corresponding snippet content using `getContextSnippetByNameAction` and replace the placeholder.
    6.  **Hover Preview:** Implement using Shadcn Tooltip/Popover components in areas displaying prompts/documents. May require client-side parsing or passing structured content. Fetch preview content if needed.
    7.  **Actions (`context-snippets-actions.ts`):**
        - `createContextSnippetAction(data: InsertContextSnippet): Promise<ActionState<SelectContextSnippet>>`
        - `getContextSnippetsAction(userId: string): Promise<ActionState<SelectContextSnippet[]>>`
        - `getContextSnippetByNameAction(name: string, userId: string): Promise<ActionState<SelectContextSnippet>>` (Used during generation)
        - `updateContextSnippetAction(id: string, data: Partial<InsertContextSnippet>, userId: string): Promise<ActionState<SelectContextSnippet>>`
        - `deleteContextSnippetAction(id: string, userId: string): Promise<ActionState<void>>`
- **Error Handling & Edge Cases:**
    - **Missing Snippet:** Handle non-existent snippet names (`@name`) during generation gracefully. Options: skip replacement, show a warning in the generated output, or fail the generation with an error message.
    - **Name Format/Validation:** Validate snippet name format (`@` followed by alphanumeric/underscore). Enforce the `@` prefix.
    - **Duplicate Name:** The database schema includes a unique constraint `(userId, name)`. Handle potential unique constraint violation errors during creation/update gracefully (e.g., show a message "Snippet name already exists").
    - **Ownership:** Ensure CRUD operations are scoped to the `userId`.

### 3.4 Real-Time Document Editing via AI Chat (Milestone 4)
- **User Story:** As a user, after generating a document, I want to refine it using a chat interface by giving commands to an AI (e.g., "make this section shorter", "turn into bullet points"), and see the document update in real-time.
- **Requirements:**
    - Enhanced Document View (`/documents/[documentId]/edit`): Split layout.
        - Main area: Displays document content (editable text area or rich text editor).
        - Sidebar: Chat interface. Input field for user commands, display area for chat history (user commands + AI responses/actions).
    - User types command, hits send.
    - AI processes command, modifies document content.
    - Main document display updates instantly.
    - Chat history logs the interaction.
    - Changes should persist (auto-save or explicit save).
- **Implementation Steps:**
    1.  **Page (`/documents/[documentId]/edit/page.tsx`):** Server component fetching initial document via `getDocumentAction`. Renders layout.
    2.  **Layout Component:** Manages split view.
    3.  **Document Editor (`document-editor.tsx`):** Client component.
        - Receives initial document content as prop.
        - Holds current document state (e.g., using `useState`, Zustand, or Jotai).
        - Renders content (e.g., using `textarea` or a library like TipTap/Lexical).
        - Provides function to update state from AI chat action.
        - Implement auto-save or manual save button calling `updateDocumentAction`.
    4.  **Chat Sidebar (`chat-sidebar.tsx`):** Client component.
        - Manages chat history state.
        - Input field for commands.
        - On send: Calls `editDocumentViaChatAction` (passes document ID, current content, user command). Displays loading state. On success, updates chat history and calls update function provided by `DocumentEditor`.
    5.  **Action (`llm-actions.ts`):**
        - `editDocumentViaChatAction(data: { documentId: string; currentContent: string; command: string; userId: string; }): Promise<ActionState<{newContent: string; aiResponse: string}>>`: Calls LLM API with specific instructions (system prompt for editing), passes current content and command. Returns new content and AI response text. **Does not save to DB directly**, returns result to client.
    6.  **State Management:** Use Zustand/Jotai to share document state between Editor and Chat Sidebar if prop drilling becomes cumbersome.
- **Error Handling & Edge Cases:**
    - Display errors from `editDocumentViaChatAction` in the chat interface (e.g., "Sorry, I couldn't apply that change. Please try rephrasing."). Handle LLM failures gracefully.
    - **Failed Edit Retry:** Provide a retry mechanism in the chat if an LLM call fails or times out.
    - **Large Content Handling:** For very large documents, consider sending only relevant sections or a summary to the LLM to stay within context limits, or inform the user the scope might be limited.
    - Consider debouncing auto-save if implemented to avoid excessive DB writes.

### 3.5 AI-Powered Prompt Improvement via Diff Comparison (Milestone 5)
- **User Story:** As a user, after editing a document (via chat or direct editing), I want the system to suggest improvements to my original prompt template so that future generations are closer to my final edited version, without losing placeholders.
- **Requirements:**
    - Triggered when user finalizes an edited document (e.g., clicks Save/Copy after edits in M4).
    - A modal appears ("Prompt Improvement Suggestion").
    - Modal displays the *suggested* updated prompt template text (and highlights what changed similar to github diff display).
    - LLM generates this suggestion based on the original prompt template and the final document content (or summary of edits).
    - Placeholders (`{{...}}`) in the original template MUST be preserved in the suggestion.
    - Buttons: "Accept & Overwrite" (updates original prompt), "Save as New Prompt" (creates a new template), "Dismiss".
- **Implementation Steps:**
    1.  **Trigger:** Add logic to the Save/Copy actions in the Document Editor (M4) to check if edits were made via chat. If so, trigger the modal.
    2.  **Modal (`prompt-improvement-modal.tsx`):** Client component.
        - Receives original prompt template ID/text and final document content as props.
        - On open: Calls `suggestPromptImprovementAction` (passes original prompt, final content, `userId`). Shows loading state.
        - Displays the suggested prompt template returned by the action. Use a diff viewer component to highlight changes.
        - Button actions:
            - "Accept & Overwrite": Calls `updatePromptTemplateAction` with the suggested text.
            - "Save as New Prompt": Calls `createPromptAction` with the suggested text (may need title adjustment).
            - "Dismiss": Closes modal.
    3.  **Action (`llm-actions.ts`):**
        - `suggestPromptImprovementAction(data: { originalPrompt: SelectPromptTemplate; finalDocumentContent: string; userId: string; }): Promise<ActionState<string>>`: Calls LLM with specific system prompt instructing it to refine `originalPrompt.optimized_prompt` based on `finalDocumentContent`, ensuring `{{placeholders}}` are kept intact. Returns the suggested prompt string.
- **Error Handling & Edge Cases:**
    - Handle failures in `suggestPromptImprovementAction` (show error in modal, allow retry or dismiss).
    - **Placeholder Integrity:** Crucial. The LLM prompt must strongly emphasize preserving `{{placeholders}}`. Add post-processing validation: check if all original placeholders exist in the suggestion. If not, either discard the suggestion, show a warning, or attempt a fix.
    - **Dismiss Option:** Ensure users can easily ignore the suggestion without being forced to choose.

### 3.6 Workflow Automation (Milestone 6)
- **User Story:** As a user, I want to chain multiple prompt templates together into workflows, run these workflows with specific inputs, track their progress, and view the generated documents for each step.
- **Requirements:**
    - `/workflows` page: Lists workflow templates and past workflow instances (runs). Buttons to create new template, run, edit, delete templates, view instances.
    - Workflow Template Editor (`/workflows/new`, `/workflows/[templateId]/edit`): Full-page interface.
        - Canvas/list to add/arrange nodes. Each node represents a prompt template step.
        - Drag-and-drop reordering.
        - Ability to select prompt templates for nodes.
        - Mechanism to map output of node A to placeholder(s) in node B.
        - Save workflow template button.
        - **Unique Node IDs:** Each node added to the workflow canvas/list is assigned a guaranteed unique string ID (e.g., UUID) within the template definition. This ID persists and is used for tracking.
    - Workflow Run (`/workflows/[templateId]/run`): User provides inputs for any initial placeholders needed by the first node(s).
    - Workflow Instance View (`/workflows/instances/[instanceId]`):
        - Visual representation of the workflow steps.
        - Real-time status updates for each node (Pending, Running, Completed, Failed). Status derived from `workflow_instances.nodeStatuses`.
        - Ability to click a completed node to view/link to the generated document (`documents.workflowInstanceId` and `documents.workflowNodeId` link back).
        - Retry mechanism for failed nodes.
- **Implementation Steps:**
    1.  **Pages:** Create pages for listing (`/workflows`), editing (`/workflows/.../edit`), running (`/workflows/.../run`), and viewing instances (`/workflows/instances/[instanceId]`). Use Server Components with Suspense where appropriate.
    2.  **List Components (`workflow-templates-list.tsx`, `workflow-instances-list.tsx`):** Display data using `DataTable`. Include action buttons.
    3.  **Workflow Editor (`workflow-editor.tsx`):** Client component (likely heavy).
        - Use a library like `reactflow` or build custom drag-drop interface.
        - State management (Zustand/Jotai) to hold workflow structure (nodes, edges, prompt mappings). Nodes must include their unique IDs.
        - Fetches available prompt templates (`getPromptTemplatesAction`).
        - On Save: Calls `createWorkflowTemplateAction` or `updateWorkflowTemplateAction`, passing the structured node data (JSON including unique node IDs).
    4.  **Workflow Instance View (`workflow-instance-view.tsx`):** Client component.
        - Fetches instance data and status (`getWorkflowInstanceAction`).
        - Uses polling or Server-Sent Events (SSE via a route handler) to get real-time status updates reflected in `nodeStatuses`.
        - Visualizes nodes and status based on `nodeStatuses`. Links completed nodes to `/documents/[documentId]/edit` using the `documentId` stored in `nodeStatuses`.
        - Retry button calls an action like `retryWorkflowNodeAction`.
    5.  **Actions (`workflow-actions.ts`, `db actions`):**
        - `createWorkflowTemplateAction(data: InsertWorkflowTemplate): Promise<ActionState<SelectWorkflowTemplate>>`
        - `getWorkflowTemplatesAction(userId: string): Promise<ActionState<SelectWorkflowTemplate[]>>`
        - `updateWorkflowTemplateAction(...)`
        - `deleteWorkflowTemplateAction(...)`
        - `createWorkflowInstanceAction(data: { templateId: string; inputs: Record<string, string>; userId: string }): Promise<ActionState<SelectWorkflowInstance>>`: Creates instance record, sets status to 'pending', initializes `nodeStatuses` based on template nodes. Potentially triggers first node execution asynchronously (start simple: sequential processing within the action initially).
        - `processWorkflowNodeAction(...)`: (Internal or triggered) Fetches prompt, gets inputs (from initial run or previous step's output document referenced via `nodeStatuses`), calls `generateDocumentAction` (passing `instanceId` and `nodeId`), saves output document linked to instance/node, updates `nodeStatuses` map for the current node (status: 'completed', `documentId`), triggers next node based on `edges`.
        - `getWorkflowInstanceAction(instanceId: string, userId: string): Promise<ActionState<WorkflowInstanceWithDetails>>`: Fetches instance data, potentially including associated documents/statuses via `nodeStatuses`.
        - `retryWorkflowNodeAction(...)`
    6.  **Future Queue-Readiness:** Initially process nodes sequentially within `runWorkflowInstanceAction` or a subsequent triggered action. Design `processWorkflowNodeAction` to be self-contained (accepting instanceId, nodeId, userId) so it can later be invoked by a queue message (e.g., Vercel Cron, Supabase Edge Function triggered by DB change, or external queue like Inngest/Celery).
- **Error Handling & Edge Cases:**
    - Handle node failures gracefully: Update the specific `nodeStatuses[nodeId]` to 'failed' with an error message. Update the overall instance status to 'failed'.
    - Provide clear error messages to the user in the Instance View.
    - Ensure data consistency during chained execution (e.g., use transactions if multiple DB updates happen per step).
    - Manage potential long-running processes if workflows become complex (initial sequential approach might hit serverless timeouts - queueing becomes necessary).
    - **Parallel Steps:** Explicitly state that initial implementation only supports sequential execution based on defined edges. Parallel execution is a future enhancement.

## 4. Database Schema
- Using Drizzle ORM with Supabase Postgres. Common fields: `id: uuid().defaultRandom().primaryKey()`, `userId: text('user_id').notNull()`, `createdAt: timestamp('created_at').defaultNow().notNull()`, `updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date())`.

### 4.1 Enums (`db/schema/enums.ts`)
```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const llmProviderEnum = pgEnum("llm_provider", ["openai", "anthropic", "grok"]);
export const workflowStatusEnum = pgEnum("workflow_status", ["pending", "running", "completed", "failed"]);
```

### 4.2 Tables

**`prompt_templates` (`db/schema/prompt-templates.ts`)**
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { llmProviderEnum } from "./enums";

export const promptTemplatesTable = pgTable("prompt_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // From Clerk auth
  title: text("title").notNull(),
  rawPrompt: text("raw_prompt"), // Initial user input, optional
  optimizedPrompt: text("optimized_prompt").notNull(), // The prompt used for generation, includes {{placeholders}}
  defaultLlmProvider: llmProviderEnum("default_llm_provider").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SelectPromptTemplate = typeof promptTemplatesTable.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplatesTable.$inferInsert;
```

**`documents` (`db/schema/documents.ts`)**
```typescript
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { promptTemplatesTable } from "./prompt-templates";
import { workflowInstancesTable } from "./workflow-instances"; // Added later
import { llmProviderEnum } from "./enums";

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  promptTemplateId: uuid("prompt_template_id").references(() => promptTemplatesTable.id, { onDelete: "set null" }), // Can be null if generated ad-hoc?
  workflowInstanceId: uuid("workflow_instance_id").references(() => workflowInstancesTable.id, { onDelete: "cascade" }), // Link to workflow run
  workflowNodeId: text("workflow_node_id"), // Identifier of the node within the workflow template that generated this
  title: text("title"), // Optional, maybe derived from prompt/content
  content: text("content").notNull(),
  llmProviderUsed: llmProviderEnum("llm_provider_used").notNull(),
  generationMetadata: jsonb("generation_metadata"), // Store inputs used, settings, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SelectDocument = typeof documentsTable.$inferSelect;
export type InsertDocument = typeof documentsTable.$inferInsert;

```

**`context_snippets` (`db/schema/context-snippets.ts`)**
```typescript
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const contextSnippetsTable = pgTable("context_snippets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(), // e.g., "@company-info", must start with @
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userIdNameIdx: uniqueIndex("user_id_name_idx").on(table.userId, table.name), // Unique name per user
  };
});

export type SelectContextSnippet = typeof contextSnippetsTable.$inferSelect;
export type InsertContextSnippet = typeof contextSnippetsTable.$inferInsert;
```

**`workflow_templates` (`db/schema/workflow-templates.ts`)**
```typescript
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Define TypeScript type for node structure if needed in `types/workflow-types.ts`
// Example: { id: string; type: 'prompt'; data: { promptTemplateId: string; }; position: { x: number; y: number; }; }
// Example Edge: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; data?: { mapOutputToPlaceholder: string }; }

export const workflowTemplatesTable = pgTable("workflow_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull(), // Array of node objects (reactflow format or similar)
  edges: jsonb("edges").notNull(), // Array of edge objects defining connections and potentially output->input mapping
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SelectWorkflowTemplate = typeof workflowTemplatesTable.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplatesTable.$inferInsert;
```

**`workflow_instances` (`db/schema/workflow-instances.ts`)**
```typescript
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workflowTemplatesTable } from "./workflow-templates";
import { workflowStatusEnum } from "./enums";

export const workflowInstancesTable = pgTable("workflow_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  workflowTemplateId: uuid("workflow_template_id").references(() => workflowTemplatesTable.id, { onDelete: "cascade" }).notNull(),
  name: text("name"), // Optional user-defined name for the run
  status: workflowStatusEnum("status").notNull().default("pending"),
  initialInputs: jsonb("initial_inputs"), // Inputs provided by user at start
  nodeStatuses: jsonb("node_statuses"), // Map<nodeId, { status: 'pending'|'running'|'completed'|'failed', documentId?: string, error?: string }>
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SelectWorkflowInstance = typeof workflowInstancesTable.$inferSelect;
export type InsertWorkflowInstance = typeof workflowInstancesTable.$inferInsert;
```

### 4.3 Relationships and Indexes
- `documents.promptTemplateId` -> `prompt_templates.id` (ON DELETE SET NULL)
- `documents.workflowInstanceId` -> `workflow_instances.id` (ON DELETE CASCADE)
- `workflow_instances.workflowTemplateId` -> `workflow_templates.id` (ON DELETE CASCADE)
- Indexes created on `userId` for all tables.
- Unique index on `context_snippets(userId, name)`.

## 5. Server Actions
- Follow `ActionState<T>` pattern defined in `.cursorrules`.
- All actions performing mutations or accessing sensitive data must retrieve `userId` via `const { userId } = auth(); if (!userId) throw new Error("Unauthorized");` and include it in WHERE clauses (e.g., `and(eq(table.id, id), eq(table.userId, userId))`) for security/ownership checks.

### 5.1 Database Actions (`actions/db/*-actions.ts`)
- **`prompts-actions.ts`:**
    - `createPromptTemplateAction(data: InsertPromptTemplate, userId: string): Promise<ActionState<SelectPromptTemplate>>`
        ```typescript
        // Example Query Snippet (inside try block):
        const [newPrompt] = await db.insert(promptTemplatesTable).values({ ...data, userId }).returning();
        ```
    - `getPromptTemplatesAction(userId: string): Promise<ActionState<SelectPromptTemplate[]>>`
        ```typescript
        // Example Query Snippet (inside try block):
        const prompts = await db.select().from(promptTemplatesTable).where(eq(promptTemplatesTable.userId, userId));
        ```
    - `getPromptTemplateAction(id: string, userId: string): Promise<ActionState<SelectPromptTemplate>>`
    - `updatePromptTemplateAction(id: string, data: Partial<InsertPromptTemplate>, userId: string): Promise<ActionState<SelectPromptTemplate>>`
    - `deletePromptTemplateAction(id: string, userId: string): Promise<ActionState<void>>`
- **`documents-actions.ts`:**
    - `createDocumentAction(...)`: Used internally.
    - `getDocumentsAction(userId: string): Promise<ActionState<SelectDocument[]>>`
    - `getDocumentAction(id: string, userId: string): Promise<ActionState<SelectDocument>>`
        ```typescript
        // Example Query Snippet (inside try block):
        const [doc] = await db.select().from(documentsTable)
          .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)));
        if (!doc) { /* handle not found / unauthorized */ }
        ```
    - `updateDocumentAction(id: string, data: Partial<InsertDocument>, userId: string): Promise<ActionState<SelectDocument>>`
    - `deleteDocumentAction(id: string, userId: string): Promise<ActionState<void>>`
- **`context-snippets-actions.ts`:**
    - `createContextSnippetAction(...)`
    - `getContextSnippetsAction(...)`
    - `getContextSnippetAction(...)`
    - `getContextSnippetByNameAction(name: string, userId: string): Promise<ActionState<SelectContextSnippet>>`
        ```typescript
        // Example Query Snippet (inside try block):
        const [snippet] = await db.select().from(contextSnippetsTable)
          .where(and(eq(contextSnippetsTable.name, name), eq(contextSnippetsTable.userId, userId)));
        ```
    - `updateContextSnippetAction(...)`
    - `deleteContextSnippetAction(...)`
- **`workflow-templates-actions.ts`:**
    - `createWorkflowTemplateAction(...)`
    - `getWorkflowTemplatesAction(...)`
    - `getWorkflowTemplateAction(...)`
    - `updateWorkflowTemplateAction(...)`
    - `deleteWorkflowTemplateAction(...)`
- **`workflow-instances-actions.ts`:**
    - `createWorkflowInstanceAction(...)`
    - `getWorkflowInstancesAction(...)`
    - `getWorkflowInstanceAction(...)`
    - `updateWorkflowInstanceStatusAction(instanceId: string, status: WorkflowStatusEnum, nodeStatuses: Json, userId: string): Promise<ActionState<void>>`
    - `getWorkflowInstancesForTemplateAction(...)`

### 5.2 Other Actions (`actions/*.ts`)
- **`llm-actions.ts` (`actions/llm-actions.ts`):**
    - `optimizePromptAction(rawPrompt: string, userId: string): Promise<ActionState<string>>`
    - `generateTitleAction(rawPrompt: string, userId: string): Promise<ActionState<string>>`
    - `generateDocumentAction(data: { promptTemplateId?: string; rawPrompt?: string; inputs: Record<string, string>; contextSnippetNames?: string[]; llmProvider: LlmProviderEnum; userId: string; workflowInstanceId?: string; workflowNodeId?: string; }): Promise<ActionState<SelectDocument>>`: Handles fetching template/snippets, placeholder/snippet replacement, calling `lib/llm.ts`, creating `documents` record (including `workflowInstanceId` and `workflowNodeId` if applicable). Logs metadata like tokens used, model name into `generationMetadata`.
    - `editDocumentViaChatAction(data: { documentId: string; currentContent: string; command: string; userId: string; }): Promise<ActionState<{newContent: string; aiResponse: string}>>`: Calls `lib/llm.ts` with edit prompt.
    - `suggestPromptImprovementAction(data: { originalPrompt: SelectPromptTemplate; finalDocumentContent: string; userId: string; }): Promise<ActionState<string>>`: Calls `lib/llm.ts` with improvement prompt.
- **`workflow-actions.ts` (`actions/workflow-actions.ts`):**
    - `runWorkflowInstanceAction(instanceId: string, userId: string): Promise<ActionState<void>>`: Orchestrates the step-by-step execution of a workflow instance. Fetches instance/template. Iterates through nodes based on `edges`, calls `generateDocumentAction` for each prompt node (passing `instanceId`, `nodeId`), updates `workflow_instances.nodeStatuses` after each step. Handles sequential execution initially.
    - `retryWorkflowNodeAction(instanceId: string, nodeId: string, userId: string): Promise<ActionState<void>>`: Allows retrying a failed node. Resets node status and re-triggers processing for that node.

### 5.3 External API Integrations
- **LLM Providers (OpenAI, Anthropic, Grok):** Interactions managed via `lib/llm.ts`. Requires API keys stored securely in `.env.local` (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROK_API_KEY`). Ensure proper error handling for API calls (timeouts, rate limits, auth errors).
  // TODO: Implement Anthropic and Grok logic in lib/llm.ts.
- **Clerk:** Authentication handled via `@clerk/nextjs` middleware and `auth()` helper. No direct API calls needed typically.
- **PostHog:** Interactions via `posthog-js` (client-side) or `posthog-node` (server-side). Requires PostHog API key and host in `.env.local` / `NEXT_PUBLIC_POSTHOG_KEY`.

### 5.4 Data Processing Algorithms
- **Placeholder Replacement:** Use simple string replacement (e.g., `text.replaceAll('{{placeholder}}', value)`) or regex for `{{placeholder}}` patterns. Applied in `generateDocumentAction`.
- **Context Snippet Injection:** Use regex `/@(\w+)/g` to find snippet names in prompts. Fetch content via `getContextSnippetByNameAction` and replace `@name` with content. Applied in `generateDocumentAction` *before* placeholder replacement.
- **LLM Usage Tracking:** Within `generateDocumentAction` (or `lib/llm.ts`), capture response metadata like tokens used (prompt/completion), model name, and potentially cost estimation. Store this structured data in `documents.generationMetadata` JSONB field.

## 6. Design System
### 6.1 Visual Style
- **Color Palette:** Define primary (e.g., Indigo/Violet gradient for CTAs), secondary (e.g., Amber/Yellow for highlights), accent, neutral (Grays), status (Green, Red, Yellow) colors. Use Tailwind color names/custom definitions. Ensure WCAG AA contrast.
    - Example Primary: `bg-gradient-to-r from-indigo-500 to-violet-500` (`#6366F1` to `#8B5CF6`)
    - Example Secondary: `#FBBF24` (Amber 400)
    - Example Success: `#10B981` (Emerald 500)
    - Example Danger: `#EF4444` (Red 500)
    - Example Neutral: Tailwind `slate` or `gray` palettes.
- **Typography:**
    - Primary Font: Inter (sans-serif), loaded via `next/font/google`.
    - Secondary Font: Poppins (sans-serif, optional for display headings), loaded via `next/font/google`.
    - Hierarchy (configure in `tailwind.config.ts` theme extensions):
        - `h1`: `text-3xl` (30px) to `text-4xl` (36px), `font-bold`, `leading-tight` (~1.2)
        - `h2`: `text-2xl` (24px) to `text-3xl` (30px), `font-semibold`, `leading-snug` (~1.3)
        - `h3`: `text-xl` (20px) to `text-2xl` (24px), `font-medium`, `leading-snug` (~1.3)
        - `body`: `text-base` (16px), `font-normal`, `leading-relaxed` (~1.6)
        - `small/caption`: `text-sm` (14px), `font-normal`, `leading-normal` (~1.4)
- **Component Styling:** Use Shadcn UI defaults as baseline. Apply custom styles via Tailwind utility classes (`@apply` sparingly). Consistent use of `rounded-md`, `shadow-sm`, etc.
- **Spacing:** 8px grid system (Tailwind spacing scale: `p-2`=8px, `m-4`=16px). Consistent margins/paddings.
- **Layout Principles:** Flexible layouts using Flexbox/Grid. Responsive breakpoints (`sm`, `md`, `lg`, `xl`) defined in Tailwind.

### 6.2 Core Components (`components/ui`, `components/utilities`)
- **Layout (`app/(protected)/layout.tsx`):** Main structure with `Sidebar` and main content area.
- **Sidebar (`components/utilities/sidebar.tsx`):** Navigation links (using Next.js `Link` or `usePathname`). Client component for active state highlighting. Uses `lucide-react` icons.
- **PageHeader (`components/utilities/page-header.tsx`):** Consistent heading style for pages, potentially with breadcrumbs or action buttons.
- **Modal (`components/ui/dialog.tsx` - Shadcn):** Used for create/edit/generate flows. Consistent header/footer/body structure.
- **DataTable (`components/ui/data-table.tsx` - Shadcn):** Used for lists (Prompts, Documents, etc.). Includes sorting, potentially filtering/pagination.
- **Button (`components/ui/button.tsx` - Shadcn):** Standard, destructive, outline, ghost, link variants. Primary CTA uses gradient style (custom class). Include loading state.
- **Input, Textarea, Select, Dropdown, Checkbox, Switch (`components/ui/*` - Shadcn):** Standard form elements. Use `label` for accessibility.
- **Tooltip, Popover (`components/ui/*` - Shadcn):** For hover previews (snippets) and additional info.
- **Skeleton (`components/ui/skeleton.tsx` - Shadcn):** For loading states in Suspense boundaries. Apply appropriate `h-`, `w-`, `rounded-md` classes.
- **LoadingSpinner (`components/utilities/loading-spinner.tsx`):** Alternative loading indicator.
- **Interactive States:** Ensure clear states leveraging Tailwind variants and Shadcn defaults:
    - `:hover`: Slight background change (`hover:bg-muted`), underline for links (`hover:underline`).
    - `:focus-visible` (Keyboard focus): Visible outline (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`). Check Shadcn defaults.
    - `:active`: Slight scale down or darker background for buttons.
    - `:disabled`: Reduced opacity (`opacity-50`), not-allowed cursor (`cursor-not-allowed`).

## 7. Component Architecture
### 7.1 Server Components (`"use server"`)
- **Data Fetching:** Primarily fetch data directly using Server Actions (`await someAction()`) or Drizzle client (`await db.query...`) within the component or in separate async functions called by the component.
- **Suspense:** Wrap async data fetching/components in `<Suspense fallback={<SkeletonLoader className="h-20 w-full" />}>` for loading states. Use appropriate skeleton shapes.
- **Error Handling:** Use `try...catch` around data fetching. If an action returns `ActionState`, check `!res.isSuccess`. Render appropriate error UI or trigger `error.tsx` boundary by re-throwing.
- **Props:** Pass fetched data, configuration, or other Server Components (as `children`) down to Client Components or other Server Components. Define props using TypeScript interfaces.
    ```typescript
    // Example: Server Page fetching data
    import { getDocumentsAction } from "@/actions/db/documents-actions";
    import DocumentsList from "./_components/documents-list"; // Can be Server or Client
    import { auth } from "@clerk/nextjs/server";

    export default async function DocumentsPage() {
      const { userId } = auth();
      if (!userId) return null; // Or redirect

      // Fetch data directly in the Server Component
      const documentsResult = await getDocumentsAction(userId);

      return (
        <div>
          <h1>My Documents</h1>
          {documentsResult.isSuccess ? (
            <DocumentsList initialDocuments={documentsResult.data} />
          ) : (
            <p>Error loading documents: {documentsResult.message}</p>
          )}
        </div>
      );
    }
    ```
- **Examples:** Page components (`/prompts/page.tsx`), list components fetching data (`prompts-list.tsx` if server-rendered), layout components (`app/(protected)/layout.tsx`).

### 7.2 Client Components (`"use client"`)
- **State Management:**
    - Local state: `useState`, `useReducer`.
    - Forms: `react-hook-form` recommended for complex forms. Use `useFormState`/`useActionState` (React 18 experimental) for simpler forms handling Server Action responses directly.
    - Shared/Complex UI State: Zustand or Jotai (e.g., for Workflow Editor nodes/edges, live document content in Chat Editor state that needs to be shared across components without excessive prop drilling). Store *ephemeral* state here; persist to DB via Server Actions on save/completion.
- **Event Handlers:** Handle user interactions (clicks, input changes, form submissions). Call Server Actions using `startTransition` to avoid blocking UI and show pending states.
- **UI Interactions:** Implement animations (Framer Motion), dynamic UI updates based on state, manage loading indicators tied to action calls.
- **Props:** Receive data (primitives, serializable objects) and callbacks from parent Server/Client components. Define props using TypeScript interfaces. Avoid passing non-serializable data like functions unless they are callbacks.
    ```typescript
    // Example: Client Modal Component
    "use client";
    import { useState } from "react";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
    import { createPromptAction } from "@/actions/db/prompts-actions"; // Server Action
    import { useTransition } from "react";
    import { toast } from "sonner"; // Example toast library

    interface CreatePromptModalProps {
      // Props passed from parent (likely a Server Component)
      // Can include initial data if needed, but actions are imported directly
    }

    export default function CreatePromptModal({}: CreatePromptModalProps) {
      const [isOpen, setIsOpen] = useState(false);
      const [isPending, startTransition] = useTransition();
      // ... form state management (e.g., useState or react-hook-form)

      const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
          // Extract data from formData or form state
          const promptData = { title: "...", optimizedPrompt: "...", defaultLlmProvider: "openai" }; // Example
          const result = await createPromptAction(promptData); // No userId needed if auth() is used inside action

          if (result.isSuccess) {
            toast.success(result.message);
            setIsOpen(false);
            // Optionally trigger router.refresh() or update parent state via callback
          } else {
            toast.error(result.message);
          }
        });
      };

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create New Prompt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Prompt</DialogTitle></DialogHeader>
            {/* Form elements here */}
            <form action={handleSubmit}> {/* Or onSubmit with event handler */}
              {/* ... inputs ... */}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Prompt"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      );
    }

    ```
- **Examples:** Modals (`create-prompt-modal.tsx`), interactive forms, `workflow-editor.tsx`, `chat-sidebar.tsx`, `document-editor.tsx`, buttons triggering actions.

## 8. Authentication & Authorization
- **Clerk Implementation:**
    - Use `@clerk/nextjs`. Wrap root layout (`app/layout.tsx`) in `<ClerkProvider>`.
    - Configure environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, etc.).
    - Use Clerk components for sign-in (`<SignIn>`), sign-up (`<SignUp>`), user profile (`<UserButton>`), organization switching if applicable.
    - Mount Clerk auth routes within the `app/(auth)` layout group (e.g., `app/(auth)/sign-in/[[...sign-in]]/page.tsx`).
- **Protected Routes:**
    - `middleware.ts` (using `@clerk/nextjs/server`) enforces authentication, ensuring routes not explicitly marked as public require a logged-in user.
    - The `(protected)` layout group visually organizes authenticated routes but protection is enforced by the middleware.
- **Session Management:** Handled automatically by Clerk's middleware and React context providers. Clerk manages tokens/cookies. No need to store session data in the application database.
- **Authorization:**
    - Server Actions MUST retrieve `userId` via `const { userId } = auth();`.
    - If `!userId`, throw an `Error("Unauthorized")` or return an appropriate `ActionState` error.
    - Database queries within actions MUST include a `where` clause filtering by `userId` (e.g., `where(eq(table.id, id), eq(table.userId, userId)))`) to ensure data ownership and prevent unauthorized access.

## 9. Data Flow
- **Server -> Client:** Server Components fetch data (using actions, Drizzle) -> Pass serializable data as props to Client Components.
- **Client -> Server (Mutations):** Client Component event handler -> Calls imported Server Action (often wrapped in `startTransition`) -> Server Action performs logic (validation, DB update, LLM call) -> Returns `ActionState` -> Client Component updates UI based on response (show toast, reset form, update local state, optionally call `router.refresh()` to re-fetch Server Component data if needed).
- **Client State:**
    - `useState`/`useReducer`: For local component state (e.g., modal open/closed, input values).
    - `react-hook-form`: For managing form state, validation, and submission.
    - Zustand/Jotai: For complex, shared UI state that needs to persist across interactions or components without prop drilling (e.g., nodes/edges in the `WorkflowEditor`, potentially the live document content in the `DocumentEditor`/`ChatSidebar` interaction). Store *ephemeral* state here; persist to DB via Server Actions on save/completion.

## 10. PostHog Analytics
- **Strategy:** Track key user lifecycle events (signup), feature engagement (prompt creation, doc generation, workflow runs).
- **Implementation:**
    - Use `posthog-js` library for client-side tracking and `posthog-node` for server-side tracking (e.g., within Server Actions after successful operations).
    - Initialize `PostHogProvider` in `app/layout.tsx` with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` from `.env`.
    - Auto-capture pageviews enabled by default via the provider.
    - Identify users: Call `posthog.identify(userId, { email: user.primaryEmailAddress?.emailAddress, name: user.fullName })` in a client component within the protected layout after Clerk's `useUser()` hook confirms user data is loaded. Reset on logout (`posthog.reset()`).
    - Custom Events (`posthog.capture('event_name', { properties })`):
        - Client-side: Triggered by user actions (button clicks, form submissions).
            ```javascript
            // Example in a client component
            import posthog from "posthog-js";
            // ... inside component after successful action
            posthog.capture('prompt_template_created', { promptId: newPrompt.id });
            ```
        - Server-side: Triggered within Server Actions after successful DB operations or significant events.
            ```typescript
            // Example in a server action
            import { PostHog } from 'posthog-node'; // Or use configured client instance
            const client = new PostHog(process.env.POSTHOG_API_KEY!, { host: process.env.POSTHOG_HOST });
            // ... after successful significant server-side event ...
            // Example:
            // await client.capture({
            //   distinctId: userId,
            //   event: 'workflow_instance_run_completed',
            //   properties: { templateId: ..., status: 'completed' },
            // })
            await client.shutdown() // Important for serverless environments
            ```
        - Key Events to Track:
            - `prompt_template_created`, `prompt_template_optimized`
            - `document_generated` (props: `promptTemplateId`, `llmProviderUsed`, `contextSnippetsUsedCount`, `workflowInstanceId`?)
            - `document_edited_via_chat` (props: `documentId`)
            - `prompt_improvement_suggested`, `prompt_improvement_accepted` (props: `originalPromptId`, `newPromptId`?)
            - `context_snippet_created`, `context_snippet_updated`
            - `workflow_template_created`, `workflow_template_updated`
            - `workflow_instance_run_started` (props: `templateId`)
            - `workflow_instance_run_completed` (props: `templateId`, `status`, `durationSeconds`?)
- **Custom Properties:**
    - User Properties (`posthog.identify` or `posthog.people.set`): `created_at`.
    - Event Properties (passed with `capture`): Relevant IDs (`promptId`, `documentId`, `templateId`, `instanceId`), settings used (`llmProvider`), counts (`contextSnippetsUsedCount`), status (`workflow_status`).

## 11. Testing
- **Frameworks:** Vitest for unit/integration tests (runs in Node environment, good for Next.js), React Testing Library (RTL) for component interactions, Playwright for E2E tests.
- **Unit Tests (`*.test.ts`):**
    - Test utility functions (`lib/utils.ts`).
    - Test Server Action logic: Mock Drizzle DB calls (`vi.mock('@/db/db', ...)`), mock LLM API calls (`vi.mock('@/lib/llm', ...)`), mock Clerk `auth()` (`vi.mock('@clerk/nextjs/server', ...)`). Verify input validation, business logic execution paths, `ActionState` return values, error handling.
    ```typescript
    // Example: testing a simple action (vitest syntax)
    import { describe, it, expect, vi } from 'vitest';
    import { getPromptTemplatesAction } from '@/actions/db/prompts-actions';
    import { db } from '@/db/db'; // Mock this
    import { promptTemplatesTable } from '@/db/schema';
    import { eq } from 'drizzle-orm';

    // Mock the db object and its methods
    vi.mock('@/db/db', () => ({
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Prompt' }]), // Mock the final query result
      },
    }));

    // Mock Clerk's auth (assuming action uses it) - adjust if auth() is imported differently
    vi.mock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => ({ userId: 'test-user-123' })),
    }));


    describe('Prompt Actions', () => {
      it('getPromptTemplatesAction should fetch prompts for a user', async () => {
        const userId = 'test-user-123';
        const result = await getPromptTemplatesAction(userId);

        expect(result.isSuccess).toBe(true);
        if (result.isSuccess) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].title).toBe('Test Prompt');
        }
        // Check if db methods were called with correct parameters
        expect(db.select).toHaveBeenCalled();
        expect(db.from).toHaveBeenCalledWith(promptTemplatesTable);
        // Drizzle conditions are complex to mock precisely, focus on the overall call pattern
        // expect(db.where).toHaveBeenCalledWith(eq(promptTemplatesTable.userId, userId));
      });
    });
    ```
- **Integration Tests (`*.test.tsx`):**
    - Test component rendering and interaction using RTL within a Vitest/Jest environment.
    - Test Client Components interacting with mocked Server Actions. Use `vi.mock` to provide mock implementations of actions.
    - Example: Test `CreatePromptModal` calls the correct action with correct data on submit.
- **E2E Tests (`tests/*.spec.ts`):**
    - Use Playwright to automate browser interactions simulating real user flows. Configure Playwright to run against a local development server (`next dev`).
    - Cover critical user paths:
        - Sign up -> Create Prompt -> Generate Document -> Edit Document -> Save.
        - Create Workflow Template -> Add Nodes -> Save -> Run Workflow -> Verify outputs/instance status.
        - Sign in -> Manage Context Snippets (Create, Edit, Delete).
    - Requires setting up a consistent test environment:
        - Seed database with test data before runs (e.g., using a script).
        - Use Clerk test credentials/modes if available.
        - Potentially mock external APIs (Stripe, LLMs) at the network level (e.g., using Playwright's network interception or tools like MSW) or use dedicated test environments/keys.
    ```typescript
    // Example Playwright test structure
    import { test, expect } from '@playwright/test';

    test.describe('Prompt Management', () => {
      test.beforeEach(async ({ page }) => {
        // Log in the user before each test in this suite
        await page.goto('/sign-in');
        // ... perform login steps ...
        await expect(page).toHaveURL('/prompts'); // Assume redirect after login
      });

      test('User can create a new prompt template', async ({ page }) => {
        await page.getByRole('button', { name: 'Create New Prompt' }).click();

        // Fill the modal form
        await page.getByLabel('Raw Prompt').fill('This is a raw prompt about {{topic}}.');
        // Assume optimization happens automatically or via button click
        await page.getByLabel('Title').fill('Test Prompt Title');
        // Select LLM...
        await page.getByRole('button', { name: 'Save Prompt' }).click();

        // Assertions: Check for success toast, check if prompt appears in the list
        await expect(page.getByText('Prompt created successfully')).toBeVisible();
        await expect(page.getByText('Test Prompt Title')).toBeVisible();
      });

      // Add more tests for editing, deleting, etc.
    });
    ```
