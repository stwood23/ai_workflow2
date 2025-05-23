# Implementation Plan

## Phase 0: Project Setup & Configuration

- [x] Step 0.1: Initialize Environment Variables
    - **Task**: Create the `.env.local` file based on `.env.example` and add placeholders for required keys (Clerk, Supabase, PostHog, OpenAI/Anthropic/Grok). Update `.env.example` if necessary.
    - **Files**:
        - `.env.local`: Create and add placeholders.
        - `.env.example`: Update with any missing keys from `tech-spec.md`.
    - **Step Dependencies**: None
    - **User Instructions**: Fill in the actual API keys and connection strings in `.env.local`. Do not commit `.env.local`.

- [x] Step 0.2: Setup Core Types & Utilities
    - **Task**: Define the base `ActionState` type and implement the `cn` utility function. Export necessary types.
    - **Files**:
        - `types/actions-types.ts`: Define `ActionState<T>`.
        - `types/index.ts`: Export `ActionState`.
        - `lib/utils.ts`: Add `cn` function from Shadcn/ui docs.
    - **Step Dependencies**: None
    - **User Instructions**: None

- [x] Step 0.3: Configure Drizzle ORM
    - **Task**: Set up the Drizzle client instance in `db/db.ts` and configure `drizzle.config.ts`. Define the shared enums.
    - **Files**:
        - `db/schema/enums.ts`: Define `llmProviderEnum`, `workflowStatusEnum`.
        - `db/schema/index.ts`: Export enums.
        - `db/db.ts`: Initialize Drizzle client (`drizzle(client, { schema: {} })`) with an empty schema object for now. Import and export `db`.
        - `drizzle.config.ts`: Configure database connection using environment variables. Ensure `schema` points to `./db/schema/index.ts`.
    - **Step Dependencies**: Step 0.1
    - **User Instructions**: Ensure Supabase connection URL is correctly set in `.env.local`.

- [x] Step 0.4: Configure Clerk Authentication Provider
    - **Task**: Set up Clerk provider in the root layout.
    - **Files**:
        - `app/layout.tsx`: Wrap content with `<ClerkProvider>`. Add `"use client"` directive if state/hooks are used, otherwise keep as `"use server"` if possible (check Clerk docs for App Router setup).
        - `middleware.ts`: (Removed - Assuming middleware is already configured as needed)
    - **Step Dependencies**: Step 0.1
    - **User Instructions**: Ensure Clerk environment variables are set in `.env.local`.

- [x] Step 0.5: Configure PostHog Analytics
    - **Task**: Set up the PostHog provider in the root layout.
    - **Files**:
        - `app/layout.tsx`: Wrap content (inside ClerkProvider) with `<PostHogProvider>`. Initialize PostHog client using environment variables.
        - `providers/posthog-provider.tsx`: (Optional but good practice) Create a client component provider wrapper for PostHog setup logic.
    - **Step Dependencies**: Step 0.1
    - **User Instructions**: Ensure PostHog environment variables are set in `.env.local`.

- [x] Step 0.6: Configure LLM Abstraction
    - **Task**: Create a placeholder file for the LLM abstraction layer. Define basic types.
    - **Files**:
        - `lib/llm.ts`: Create file with placeholder comments for future LLM API interaction logic.
        - `types/llm-types.ts`: Define basic types like `LlmProviderEnum` (reference from `db/schema/enums.ts` if possible or redefine if needed for frontend flexibility).
        - `types/index.ts`: Export LLM types.
    - **Step Dependencies**: Step 0.1, Step 0.3 (for enums)
    - **User Instructions**: Ensure LLM provider API keys are set in `.env.local`.

## Phase 1: Core Backend & Layout

- [x] Step 1.1: Verify & Update Protected Layout & Sidebar
    - **Task**: Ensure the existing layout for authenticated users includes a functional sidebar meeting the spec requirements (links, icons, active state).
    - **Files**:
        - `app/(protected)/layout.tsx`: Verify it's marked `"use server"`, includes `<Sidebar />`.
        - `components/utilities/sidebar.tsx` (or existing equivalent): Verify/update to be `"use client"`. Add/update navigation links (Prompts, Documents, Context, Workflows, Settings) using `lucide-react` icons. Implement active link highlighting using `usePathname`.
        - `components/utilities/sidebar-provider.tsx`: Create if needed for sidebar state management (e.g., mobile toggle).
        - `lib/hooks/use-sidebar.ts`: Create if `sidebar-provider.tsx` is created.
    - **Step Dependencies**: Step 0.4
    - **User Instructions**: Ensure `lucide-react` is installed (`npm install lucide-react`). Verify the paths for the layout and sidebar files match your existing structure.

- [x] Step 1.2: Create Shared Utility Components
    - **Task**: Check to see if basic shared utility components like PageHeader, LoadingSpinner, SkeletonLoader exist. If not, Implement them.
    - **Files**:
        - `components/utilities/page-header.tsx`: Create component for consistent page titles.
        - `components/utilities/loading-spinner.tsx`: Create a loading spinner component.
        - `components/utilities/skeleton-loader.tsx`: Create a reusable skeleton loader component based on Shadcn's Skeleton.
        - `components/ui/skeleton.tsx`: Ensure Shadcn Skeleton component exists.
    - **Step Dependencies**: None
    - **User Instructions**: Ensure Shadcn UI is initialized (`npx shadcn-ui@latest init`) and necessary base components (like skeleton) are added.

## Phase 2: Milestone 1 - Prompt Template Management

- [x] Step 2.1: Define Prompt Template Schema & Actions
    - **Task**: Create the `prompt_templates` table schema and CRUD actions. Update `db.ts`.
    - **Files**:
        - `db/schema/prompt-templates.ts`: Define `promptTemplatesTable` schema.
        - `db/schema/index.ts`: Export schema types and table.
        - `db/db.ts`: Add `promptTemplates: promptTemplatesTable` to the schema object.
        - `actions/db/prompts-actions.ts`: Implement `createPromptTemplateAction`, `getPromptTemplatesAction`, `getPromptTemplateAction`, `updatePromptTemplateAction`, `deletePromptTemplateAction`. Include `userId` checks.
    - **Step Dependencies**: Step 0.3
    - **User Instructions**: Run `npx drizzle-kit push:pg` to sync schema changes.

- [x] Step 2.2: Implement LLM Actions for Prompts
    - **Task**: Implement server actions for optimizing prompts and generating titles using the LLM abstraction layer.
    - **Files**:
        - `actions/llm-actions.ts`: Implement `optimizePromptAction` and `generateTitleAction`. These will call functions (to be defined later) in `lib/llm.ts`. Include `userId` checks (for rate limiting/feature gating later if needed).
        - `lib/llm.ts`: Add placeholder functions like `callLlmApi(prompt, provider, options)` that these actions can call. Define system prompts in `prompts/` directory.
        - `prompts/optimize_prompt.txt`: Create system prompt for optimization.
        - `prompts/generate_title.txt`: Create system prompt for title generation.
    - **Step Dependencies**: Step 0.6, Step 2.1
    - **User Instructions**: None

- [x] Step 2.3: Create Prompts Page UI
    - **Task**: Build the main page for listing prompt templates using server components and suspense.
    - **Files**:
        - `app/(protected)/prompts/page.tsx`: Server component. Fetch prompts using `getPromptTemplatesAction`. Use Suspense with a skeleton fallback. Render `PromptsList` and `CreatePromptButton`.
        - `app/(protected)/prompts/_components/prompts-list.tsx`: Component to display prompts (use Shadcn Card). Needs props for prompts data. Include Generate Document, Edit, Delete buttons (initially placeholders or disabled).
        - `app/(protected)/prompts/_components/prompts-list-skeleton.tsx`: Skeleton loader for the prompts list.
        - `app/(protected)/prompts/_components/create-prompt-button.tsx`: Client component button triggering the modal.
        - `components/ui/card.tsx`: Ensure Shadcn Card component is added.
        - `components/ui/button.tsx`: Ensure Shadcn Button component is added.
    - **Step Dependencies**: Step 1.1, Step 1.2, Step 2.1
    - **User Instructions**: Add Shadcn `Card` component (`npx shadcn-ui@latest add card`).

## Phase 3: Milestone 3 & 3.1 - Context Snippet Management & TipTap Integration

- [x] Step 3.1: Define Context Snippet Schema & Actions
    - **Task**: Create the `context_snippets` table schema and CRUD actions. Implement unique index constraint. Update `db.ts`.
    - **Files**:
        - `db/schema/context-snippets.ts`: Define `contextSnippetsTable` schema with `uniqueIndex` on `userId` and `name`.
        - `db/schema/index.ts`: Export schema types and table.
        - `db/db.ts`: Add `contextSnippets: contextSnippetsTable` to the schema object.
        - `actions/db/context-snippets-actions.ts`: Implement `createContextSnippetAction`, `getContextSnippetsAction`, `getContextSnippetAction`, `getContextSnippetByNameAction`, `updateContextSnippetAction`, `deleteContextSnippetAction`. Include `userId` checks. Handle potential unique constraint errors on create/update. **Ensure `getContextSnippetsAction` accepts an optional `search?: string` parameter for filtering.**
    - **Step Dependencies**: Step 0.3
    - **User Instructions**: Run `npx drizzle-kit push:pg` to sync schema changes.

- [x] Step 3.2: Create Context Snippets Page UI
    - **Task**: Build the main page for listing context snippets.
    - **Files**:
        - `app/(protected)/context/page.tsx`: Server component. Fetch snippets using `getContextSnippetsAction`. Use Suspense. Render `SnippetsList` and `CreateSnippetButton`.
        - `app/(protected)/context/_components/snippets-list.tsx`: Component to display snippets (use Shadcn Table or Cards). Include Edit/Delete buttons.
        - `app/(protected)/context/_components/snippets-list-skeleton.tsx`: Skeleton loader.
        - `app/(protected)/context/_components/create-snippet-button.tsx`: Client component button triggering the modal.
        - `components/ui/table.tsx`: Ensure Shadcn Table component is added if used.
    - **Step Dependencies**: Step 1.1, Step 1.2, Step 3.1
    - **User Instructions**: Add Shadcn `Table` if needed (`npx shadcn-ui@latest add table`).

- [x] Step 3.3: Create Context Snippet Modal
    - **Task**: Build the client component modal for creating/editing snippets.
    - **Files**:
        - `app/(protected)/context/_components/create-edit-snippet-modal.tsx`: Client component (Dialog). Use `react-hook-form`. Handle both create and edit modes. Call `createContextSnippetAction` or `updateContextSnippetAction`. Refresh list on success. Validate name format (`@\w+`).
    - **Step Dependencies**: Step 3.1, Step 3.2
    - **User Instructions**: None

- [x] Step 3.4: Add Analytics for Context Snippets
    - **Task**: Integrate PostHog tracking for snippet creation.
    - **Files**:
        - `app/(protected)/context/_components/create-edit-snippet-modal.tsx`: Call `posthog.capture('context_snippet_created')` on successful creation.
    - **Step Dependencies**: Step 0.5, Step 3.3
    - **User Instructions**: None

- [ ] Step 3.5: Setup TipTap Rich Text Editor Component
    - **Task**: Install TipTap dependencies. Create a reusable `RichTextEditor` component wrapping TipTap v3 with the Starter Kit.
    - **Files**:
        - `package.json`: Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mention`.
        - `components/editor/rich-text-editor.tsx`: (New or update existing placeholder) Create the client component. Initialize TipTap `useEditor` with `StarterKit`. Expose props for content (`value`, `onChange` or `react-hook-form` integration).
    - **Step Dependencies**: None
    - **User Instructions**: Install dependencies (`npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention`).

- [ ] Step 3.6: Implement TipTap Mention Extension for Snippets
    - **Task**: Configure TipTap's Mention extension for `@` snippet autocomplete. Create suggestion utility using the DB action.
    - **Files**:
        - `components/editor/mention-extension.ts`: (New file) Define the suggestion configuration object for the Mention extension.
            - `items`: Function that takes a query string, calls a helper function (defined next) to fetch filtered snippets.
            - `render`: Function to render the suggestion list (use Shadcn `Command` component).
            - `char`: Set to `'@'`.
        - `lib/snippets-autocomplete.ts`: (New file) Client-side helper function `fetchSnippets(query: string): Promise<Snippet[]>`. This function calls `getContextSnippetsAction({ search: query })`. Implement debouncing here.
        - `components/editor/rich-text-editor.tsx`: Import and add the configured `Mention.configure({ suggestion: ... })` extension to the `useEditor` hook's `extensions` array.
        - `actions/db/context-snippets-actions.ts`: Double-check `getContextSnippetsAction` handles the `search` filter correctly (e.g., using `like` operator in Drizzle query).
        - `components/ui/command.tsx`: Ensure Shadcn Command component is added.
    - **Step Dependencies**: Step 3.1, Step 3.5
    - **User Instructions**: Add Shadcn `Command` (`npx shadcn-ui@latest add command`).

- [ ] Step 3.7: Integrate TipTap Editor into Prompt Modal
    - **Task**: Replace the `Textarea` components in the `CreatePromptModal` with the new `RichTextEditor`. Ensure the editor's plain text output (with `@snippet-name`) is saved.
    - **Files**:
        - `app/(protected)/prompts/_components/create-prompt-modal.tsx`: Replace `Textarea` for `rawPrompt` and `optimizedPrompt` fields with the `RichTextEditor` component. Integrate with `react-hook-form` (e.g., using `Controller` or ensuring `onChange` updates form state with `editor.getText()`).
    - **Step Dependencies**: Step 2.4, Step 3.5
    - **User Instructions**: None

- [ ] Step 3.8: Implement Snippet Token Styling & Hover Preview
    - **Task**: Add styling to render the `@snippet-name` mentions as blue pills within the TipTap editor. Implement hover preview using Tooltip/Popover.
    - **Files**:
        - `components/editor/mention-extension.ts`: Update the Mention configuration.
            - Add `renderLabel` function to customize how the mention text is displayed within the editor (wrap in a span with Tailwind classes).
            - Potentially use `nodeProps` or decorate the node to apply specific attributes/classes for styling and attaching hover handlers.
        - `components/editor/rich-text-editor.tsx`: If using decoration or complex rendering, this component might need adjustments. Implement hover logic: wrap the rendered mention span in a Shadcn `Tooltip` or `Popover`. The trigger should fetch the relevant snippet details (`getContextSnippetByNameAction`) to display the preview.
        - `components/ui/tooltip.tsx`: Ensure Shadcn Tooltip is added.
        - `components/ui/popover.tsx`: Ensure Shadcn Popover is added.
    - **Step Dependencies**: Step 3.1, Step 3.6
    - **User Instructions**: Add Shadcn `Tooltip`, `Popover` (`npx shadcn-ui@latest add tooltip popover`). Refine Tailwind classes (`bg-sky-100 text-sky-700 rounded px-1.5 py-0.5`, etc.) for the blue pill style.

- [ ] Step 3.9: Update Prompt Refinement UI for Context Snippets
    - **Task**: Modify the refinement step UI in the prompt creation modal to parse snippets from the raw input's plain text and display them.
    - **Files**:
        - `app/(protected)/prompts/_components/create-prompt-modal.tsx`:
            - Update the "Inputs" header in the refinement view to "Inputs & Context".
            - In the logic that populates the refinement view, parse the *plain text* (`editor.getText()`) from the raw input `RichTextEditor` state using a regex (`/@(\w+)/g`) to find snippet names.
            - Display the extracted snippet names (e.g., styled as blue pills) in the "Inputs & Context" section.
            - Ensure the `RichTextEditor` in the refinement view correctly displays the optimized prompt text including the styled `@snippet-name` tokens carried over from the optimization step (which should also use the TipTap editor).
    - **Step Dependencies**: Step 3.7
    - **User Instructions**: None

- [ ] Step 3.10: Update Generation Logic to Inject Snippet Content
    - **Task**: Modify the document generation action (`generateDocumentAction`) to parse `@snippet-name` from the prompt's *plain text*, resolve references into their full content, and inject them before sending to the LLM.
    - **Files**:
        - `actions/llm-actions.ts` (`generateDocumentAction`):
            - **Input**: Assume the prompt template text received here is plain text containing `@snippet-name`.
            - **Parsing**: Use regex (`/@(\w+)/g`) to find all snippet names in the prompt text.
            - **Fetching**: Fetch the full `content` for each unique snippet name using `getContextSnippetByNameAction`.
            - **Replacement**: Replace each `@snippet-name` occurrence in the prompt string with the corresponding fetched content, using a defined format (e.g., `\n--- Snippet: @name ---\n[CONTENT]\n---\n`).
            - **Placeholders**: After snippet injection, perform `{{placeholder}}` replacement.
            - **LLM Call**: Send the fully resolved prompt (with injected snippets and replaced placeholders) to the LLM.
        - `actions/db/context-snippets-actions.ts`: Ensure `getContextSnippetByNameAction(name, userId)` exists and works correctly.
    - **Step Dependencies**: Step 3.1, Step 3.7 (ensures `@name` format), Step 5.3 (where generation is called)
    - **User Instructions**: Confirm the desired format for injecting snippet content into the final prompt during generation. Ensure snippet names don't clash with placeholders or LLM syntax.

## Phase 4: Prompt Template Snippet Integration (@mention with Lexical)

- [ ] Step 4.1: Enhance Schemas & Backend for Snippet References
    - **Task**: Update `prompt_templates` schema to handle Lexical state (e.g., use `jsonb` or `text` for content fields). Ensure `context_snippets` schema exists. Implement action to fetch snippets for autocomplete. Modify prompt actions to handle Lexical state.
    - **Files**:
        - `db/schema/prompt-templates.ts`: Adjust `rawPrompt`, `optimizedPrompt` column types if needed.
        - `db/schema/context-snippets.ts`: Verify schema exists from Phase 3.
        - `actions/db/context-snippets-actions.ts`: Implement `getSnippetsForAutocompleteAction(userId)`.
        - `actions/db/prompts-actions.ts`: Update `create/update/get` actions to serialize/deserialize Lexical state potentially containing snippet references.
    - **Step Dependencies**: Step 2.1, Step 3.1
    - **User Instructions**: Run `npx drizzle-kit push:pg` if schema changed.

- [ ] Step 4.2: Integrate Lexical Editor
    - **Task**: Install Lexical. Create a reusable `RichTextEditor` component. Replace `textarea` inputs in Prompt creation/editing modals with this editor.
    - **Files**:
        - `package.json`: Add `lexical`, `@lexical/react`.
        - `components/utilities/rich-text-editor.tsx`: Create the reusable Lexical editor component.
        - `app/(protected)/prompts/_components/create-prompt-modal.tsx`: Replace `Textarea` for `rawPrompt` and `optimizedPrompt` with `RichTextEditor`. Ensure editor state is correctly handled by `react-hook-form` and passed to actions.
    - **Step Dependencies**: Step 2.4
    - **User Instructions**: Install dependencies (`npm install lexical @lexical/react`).

- [ ] Step 4.3: Implement Snippet Autocomplete & Custom Node
    - **Task**: Configure Lexical typeahead for `@` mentions. Fetch suggestions using `getSnippetsForAutocompleteAction`. Create a custom `SnippetNode` to represent references and style it.
    - **Files**:
        - `components/utilities/rich-text-editor.tsx`: Add Lexical typeahead plugin configuration. Implement logic to call the autocomplete action.
        - `components/lexical/nodes/snippet-node.ts`: Define the custom `SnippetNode` (stores `snippetId`, `snippetName`).
        - `components/lexical/plugins/snippet-plugin.tsx`: (If needed) Plugin to register the node and its rendering/styling (e.g., blue pill shape).
    - **Step Dependencies**: Step 4.1, Step 4.2
    - **User Instructions**: None

- [ ] Step 4.4: Update Prompt Refinement UI for Context
    - **Task**: Modify the refinement step UI in the prompt creation modal to display included snippets.
    - **Files**:
        - `app/(protected)/prompts/_components/create-prompt-modal.tsx`:
            - Update the "Inputs" header in the refinement view to "Inputs & Context".
            - Add logic to parse the editor state from the raw input step, extract `SnippetNode`s, and display their names (e.g., styled as blue pills) in the "Inputs & Context" section.
            - Ensure the `RichTextEditor` in the refinement view correctly displays the carried-over `SnippetNode`s.
    - **Step Dependencies**: Step 4.2, Step 4.3
    - **User Instructions**: None

- [ ] Step 4.5: Update Generation Logic to Inject Snippets
    - **Task**: Modify the document generation action to resolve snippet references into content.
    - **Files**:
        - `actions/llm-actions.ts` (`generateDocumentAction`):
            - Before calling the LLM: Parse the prompt template's Lexical state to find all `SnippetNode`s.
            - Extract `snippetId` from each node.
            - Fetch the full `content` for each unique `snippetId` using `getContextSnippetAction` (or a bulk fetch action).
            - Replace the `SnippetNode` representations in the prompt content string with the actual fetched snippet content, using a clear format (e.g., delimiters).
            - Send the resolved prompt to the LLM.
        - `actions/db/context-snippets-actions.ts`: Ensure `getContextSnippetAction(id, userId)` exists and works.
    - **Step Dependencies**: Step 4.1, Step 4.3, Step 4.4 (implicitly relies on generation trigger)
    - **User Instructions**: Define the desired format for injecting snippet content into the final prompt.

## Phase 5: Milestone 2 - Document Generation (Renumbered)

- [ ] Step 5.1: Define Document Schema (Renumbered)
    - **Task**: Create the `documents` table schema, including references to prompts and placeholders for workflows. Update `db.ts`.
    - **Files**:
        - `db/schema/documents.ts`: Define `documentsTable` schema, including `promptTemplateId` FK (ON DELETE SET NULL), nullable `workflowInstanceId` and `workflowNodeId`. Add `generationMetadata` (jsonb).
        - `db/schema/index.ts`: Export schema types and table.
        - `db/db.ts`: Add `documents: documentsTable` to the schema object.
    - **Step Dependencies**: Step 0.3
    - **User Instructions**: Run `npx drizzle-kit push:pg`.

- [ ] Step 5.2: Implement Document DB Actions
    - **Task**: Create CRUD actions for documents.
    - **Files**:
        - `actions/db/documents-actions.ts`: Implement `createDocumentAction` (internal use for generation), `getDocumentsAction`, `getDocumentAction`, `updateDocumentAction`, `deleteDocumentAction`. Include `userId` checks.
    - **Step Dependencies**: Step 5.1
    - **User Instructions**: None

- [ ] Step 5.3: Update LLM Action for Document Generation
    - **Task**: Enhance `llm-actions.ts` to handle document generation, including placeholder replacement and context snippet injection.
    - **Files**:
        - `actions/llm-actions.ts`: Implement `generateDocumentAction`. Logic should:
            - Accept `promptTemplateId` or `rawPrompt`.
            - Fetch template if ID provided (`getPromptTemplateAction`).
            - Parse prompt for `{{placeholders}}` and `@snippets`.
            - Fetch snippet content (`getContextSnippetByNameAction`).
            - Replace placeholders and snippets in the prompt string.
            - Call `lib/llm.ts` function.
            - Call `createDocumentAction` to save the result.
            - Return the new document.
        - `lib/llm.ts`: Refine `callLlmApi` or add specific generation function.
        - `actions/db/context-snippets-actions.ts`: Ensure `getContextSnippetByNameAction` exists and works.
        - `actions/db/prompts-actions.ts`: Ensure `getPromptTemplateAction` exists.
        - `actions/db/documents-actions.ts`: Ensure `createDocumentAction` exists.
    - **Step Dependencies**: Step 0.6, Step 2.1, Step 3.1, Step 5.2
    - **User Instructions**: None

- [ ] Step 5.4: Create Documents Page UI
    - **Task**: Build the main page for listing generated documents.
    - **Files**:
        - `app/(protected)/documents/page.tsx`: Server component. Fetch documents using `getDocumentsAction`. Use Suspense. Render `DocumentsList` and `GenerateDocumentButton`.
        - `app/(protected)/documents/_components/documents-list.tsx`: Component using Shadcn `DataTable` to display documents (title, timestamp, prompt used). Link rows/actions to `/[documentId]/edit`.
        - `app/(protected)/documents/_components/documents-list-skeleton.tsx`: Skeleton loader.
        - `app/(protected)/documents/_components/generate-document-button.tsx`: Client component button triggering the modal.
        - `components/ui/data-table.tsx`: Ensure Shadcn DataTable component is added/configured.
    - **Step Dependencies**: Step 1.1, Step 1.2, Step 4.2
    - **User Instructions**: Add Shadcn `DataTable` (`npx shadcn-ui@latest add table`, plus custom data-table component setup as per Shadcn docs).

- [ ] Step 4.5: Create Document Generation Modal
    - **Task**: Build the modal for selecting a prompt, filling placeholders, and generating a document.
    - **Files**:
        - `app/(protected)/documents/_components/generate-document-modal.tsx`: Client component (Dialog).
            - Fetch prompts (`getPromptTemplatesAction`) for dropdown.
            - On prompt select, parse for `{{placeholders}}` and render input fields dynamically.
            - Display default LLM, allow override, include "Update Prompt's Default LLM" checkbox/logic calling `updatePromptTemplateAction`.
            - On Generate, call `generateDocumentAction`. Handle loading/errors. On success, close modal and refresh list or navigate to edit page (`router.push(`/documents/${newDoc.id}/edit`)`).
    - **Step Dependencies**: Step 2.1, Step 4.3, Step 4.4
    - **User Instructions**: Install any necessary libraries for dynamic form generation if `react-hook-form` isn't sufficient.

- [ ] Step 4.6: Create Basic Document Edit Page
    - **Task**: Create the initial page structure for viewing and potentially editing a document.
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/page.tsx`: Server component. Fetch document using `getDocumentAction(params.documentId, userId)`. Pass content to a client component editor. Include Save/Copy/Download buttons (initially basic). Use Suspense.
        - `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: Basic client component receiving initial content. Render in a `<textarea>` initially. Implement basic Save functionality calling `updateDocumentAction`.
    - **Step Dependencies**: Step 4.2, Step 4.4
    - **User Instructions**: None

- [ ] Step 4.7: Add Analytics for Documents
    - **Task**: Integrate PostHog tracking for document generation.
    - **Files**:
        - `app/(protected)/documents/_components/generate-document-modal.tsx`: Call `posthog.capture('document_generated', { promptTemplateId: ..., llmProviderUsed: ... })` on successful generation.
    - **Step Dependencies**: Step 0.5, Step 4.5
    - **User Instructions**: None

## Phase 5: Milestone 4 - Real-Time Document Editing via AI Chat

- [ ] Step 5.1: Implement LLM Action for Chat Editing
    - **Task**: Create the server action to handle AI-based document edits via chat command.
    - **Files**:
        - `actions/llm-actions.ts`: Implement `editDocumentViaChatAction`. Takes current content and command, calls LLM with specific edit instructions (new system prompt), returns new content and AI response. **Does not save to DB.**
        - `lib/llm.ts`: Add function for chat-based editing.
        - `prompts/edit_document.txt`: Create system prompt for editing task.
    - **Step Dependencies**: Step 0.6, Step 4.6
    - **User Instructions**: None

- [ ] Step 5.2: Enhance Document Edit Page Layout
    - **Task**: Update the edit page to a split layout with the document editor and a chat sidebar.
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/page.tsx`: Update to render a split layout component, passing document data down.
        - `app/(protected)/documents/[documentId]/edit/_components/edit-layout.tsx`: New component managing the two-column layout (Editor on one side, Chat on the other). May need client-side state management integration (Zustand/Jotai).
        - `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: Update props if needed. Consider using a richer editor like TipTap/Lexical instead of `<textarea>` if required by spec (for complex edits). Implement function to receive updates from chat. Add auto-save logic or refine manual save.
        - `app/(protected)/documents/[documentId]/edit/_components/chat-sidebar.tsx`: Create the client component for the chat interface. Manage chat history state. Input field calls `editDocumentViaChatAction`. On success, update local history and call update function in `DocumentEditor`.
    - **Step Dependencies**: Step 4.6, Step 5.1
    - **User Instructions**: Install editor libraries if used (e.g., `npm install @tiptap/react @tiptap/starter-kit`). Install state management library if needed (`npm install zustand` or `npm install jotai`).

- [ ] Step 5.3: Add State Management (if needed)
    - **Task**: Implement Zustand/Jotai store to share document state between editor and chat sidebar if prop drilling is insufficient.
    - **Files**:
        - `lib/stores/document-edit-store.ts`: Define the store (e.g., holding `currentContent`, `setContent`).
        - `app/(protected)/documents/[documentId]/edit/_components/edit-layout.tsx`: Initialize/provide the store.
        - `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: Use the store hook to get/set content.
        - `app/(protected)/documents/[documentId]/edit/_components/chat-sidebar.tsx`: Use the store hook to get current content for the action and call `setContent` after successful edit.
    - **Step Dependencies**: Step 5.2
    - **User Instructions**: None (assuming library installed in previous step).

- [ ] Step 5.4: Add Analytics for Chat Editing
    - **Task**: Integrate PostHog tracking for chat edits.
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/_components/chat-sidebar.tsx`: Call `posthog.capture('document_edited_via_chat')` when `editDocumentViaChatAction` succeeds.
    - **Step Dependencies**: Step 0.5, Step 5.2
    - **User Instructions**: None

## Phase 6: Milestone 5 - AI-Powered Prompt Improvement

- [ ] Step 6.1: Implement LLM Action for Prompt Suggestion
    - **Task**: Create the server action to suggest prompt improvements based on edits.
    - **Files**:
        - `actions/llm-actions.ts`: Implement `suggestPromptImprovementAction`. Takes original prompt template and final document content. Calls LLM with specific system prompt instructing it to refine the prompt while preserving `{{placeholders}}`. Returns suggested prompt string.
        - `lib/llm.ts`: Add function for prompt improvement.
        - `prompts/suggest_prompt_improvement.txt`: Create system prompt for this task.
    - **Step Dependencies**: Step 0.6, Step 2.1, Step 5.1
    - **User Instructions**: None

- [ ] Step 6.2: Create Prompt Improvement Modal
    - **Task**: Build the modal that displays the suggested prompt improvements and handles user actions.
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/_components/prompt-improvement-modal.tsx`: Client component (Dialog). Receives original prompt and final content. Calls `suggestPromptImprovementAction` on open. Displays suggestion (potentially using a diff viewer). Buttons call `updatePromptTemplateAction` (overwrite) or `createPromptTemplateAction` (save as new).
        - `components/utilities/diff-viewer.tsx`: (Optional) Component to display text diffs nicely.
    - **Step Dependencies**: Step 2.1, Step 5.2, Step 6.1
    - **User Instructions**: Install a diff viewer library if needed (e.g., `npm install react-diff-viewer`).

- [ ] Step 6.3: Trigger Prompt Improvement Modal
    - **Task**: Add logic to the document editor to trigger the modal when appropriate (e.g., on save/copy after chat edits).
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/_components/document-editor.tsx`: Add state to track if chat edits occurred. On Save/Copy action, if edits occurred, open the `PromptImprovementModal`, passing necessary data.
    - **Step Dependencies**: Step 5.2, Step 6.2
    - **User Instructions**: None

- [ ] Step 6.4: Add Analytics for Prompt Improvement
    - **Task**: Integrate PostHog tracking for prompt improvement suggestions and acceptance.
    - **Files**:
        - `app/(protected)/documents/[documentId]/edit/_components/prompt-improvement-modal.tsx`: Call `posthog.capture('prompt_improvement_suggested')` when suggestion is loaded. Call `posthog.capture('prompt_improvement_accepted', { action: 'overwrite' | 'save_new' })` when user accepts.
    - **Step Dependencies**: Step 0.5, Step 6.2
    - **User Instructions**: None

## Phase 7: Milestone 6 - Workflow Automation

- [ ] Step 7.1: Define Workflow Schemas
    - **Task**: Create `workflow_templates` and `workflow_instances` schemas. Update `documents` schema FK. Define workflow types. Update `db.ts`.
    - **Files**:
        - `db/schema/workflow-templates.ts`: Define `workflowTemplatesTable` with `nodes` and `edges` (jsonb).
        - `db/schema/workflow-instances.ts`: Define `workflowInstancesTable` with FK to templates, status enum, `initialInputs`, `nodeStatuses` (jsonb).
        - `db/schema/documents.ts`: Add/confirm `workflowInstanceId` FK (`ON DELETE CASCADE`) and `workflowNodeId`.
        - `db/schema/index.ts`: Export new schemas and types.
        - `db/db.ts`: Add new tables to the schema object.
        - `types/workflow-types.ts`: Define TypeScript interfaces for node/edge structure (e.g., `WorkflowNode`, `WorkflowEdge`).
        - `types/index.ts`: Export workflow types.
    - **Step Dependencies**: Step 0.3, Step 4.1
    - **User Instructions**: Run `npx drizzle-kit push:pg`.

- [ ] Step 7.2: Implement Workflow DB Actions
    - **Task**: Create CRUD actions for workflow templates and instances.
    - **Files**:
        - `actions/db/workflow-templates-actions.ts`: CRUD actions for templates (`create`, `getMultiple`, `getSingle`, `update`, `delete`). Include `userId` checks.
        - `actions/db/workflow-instances-actions.ts`: Actions for instances (`create`, `getMultiple`, `getSingle`, `updateStatusAndNodes`, `getForTemplate`). Include `userId` checks.
    - **Step Dependencies**: Step 7.1
    - **User Instructions**: None

- [ ] Step 7.3: Implement Workflow Orchestration Actions
    - **Task**: Create server actions to run workflows and retry nodes.
    - **Files**:
        - `actions/workflow-actions.ts`:
            - `runWorkflowInstanceAction`: Takes instance ID. Fetches template and instance data. Iterates through nodes based on `edges`. For each node: determine inputs (initial or from previous node's document), call `generateDocumentAction`, update `nodeStatuses` in instance record using `updateWorkflowInstanceStatusAction`. Handle errors, update final instance status. (Start with sequential execution).
            - `retryWorkflowNodeAction`: Takes instance ID and node ID. Resets node status, re-runs the logic for that specific node from `runWorkflowInstanceAction`.
        - `actions/llm-actions.ts`: Ensure `generateDocumentAction` correctly handles being called by the workflow (e.g., accepts necessary context, links document to instance/node ID).
        - `actions/db/workflow-instances-actions.ts`: Ensure `updateStatusAndNodes` action works correctly for updating jsonb field.
    - **Step Dependencies**: Step 4.3, Step 7.1, Step 7.2
    - **User Instructions**: Consider implications if workflows become long-running (may need background jobs/queues later, but start simple).

- [ ] Step 7.4: Create Workflows Page UI
    - **Task**: Build the page listing workflow templates and instances.
    - **Files**:
        - `app/(protected)/workflows/page.tsx`: Server component. Fetch templates (`getWorkflowTemplatesAction`) and instances (`getWorkflowInstancesAction`). Use Suspense. Render `WorkflowTemplatesList`, `WorkflowInstancesList`, and "Create Workflow" button.
        - `app/(protected)/workflows/_components/workflow-templates-list.tsx`: Component (DataTable) listing templates with Edit, Run, Delete actions.
        - `app/(protected)/workflows/_components/workflow-instances-list.tsx`: Component (DataTable) listing instances with View action.
        - `app/(protected)/workflows/_components/create-workflow-button.tsx`: Button linking to `/workflows/new`.
    - **Step Dependencies**: Step 1.1, Step 1.2, Step 7.2
    - **User Instructions**: None

- [ ] Step 7.5: Create Workflow Editor Page & Component
    - **Task**: Build the full-page editor for creating/editing workflow templates.
    - **Files**:
        - `app/(protected)/workflows/new/page.tsx`: Server component wrapper for the editor.
        - `app/(protected)/workflows/[templateId]/edit/page.tsx`: Server component, fetches template data (`getWorkflowTemplateAction`) and passes to editor.
        - `app/(protected)/workflows/_components/workflow-editor.tsx`: Client component (heavy). Use `reactflow` or similar library.
            - Manage nodes/edges state (Zustand/Jotai recommended).
            - Fetch prompt templates (`getPromptTemplatesAction`) for node selection.
            - Implement drag-drop, node connection logic (mapping outputs to inputs).
            - On Save, call `createWorkflowTemplateAction` or `updateWorkflowTemplateAction`.
    - **Step Dependencies**: Step 2.1, Step 7.2, Step 7.4
    - **User Instructions**: Install workflow library (`npm install reactflow`). Install state management if not already present.

- [ ] Step 7.6: Create Workflow Run Page
    - **Task**: Build the page to initiate a workflow run, collecting initial inputs.
    - **Files**:
        - `app/(protected)/workflows/[templateId]/run/page.tsx`: Server component. Fetch template (`getWorkflowTemplateAction`). Render `WorkflowRunForm`.
        - `app/(protected)/workflows/_components/workflow-run-form.tsx`: Client component. Parses first node(s) for required initial `{{placeholders}}`. Renders form fields. On Submit, calls `createWorkflowInstanceAction`, then calls `runWorkflowInstanceAction` (or triggers it), then navigates to instance view (`router.push('/workflows/instances/...')`).
    - **Step Dependencies**: Step 7.1, Step 7.2, Step 7.3, Step 7.4
    - **User Instructions**: None

- [ ] Step 7.7: Create Workflow Instance View Page & Component
    - **Task**: Build the page to view the progress and results of a workflow instance.
    - **Files**:
        - `app/(protected)/workflows/instances/[instanceId]/page.tsx`: Server component. Fetch instance data (`getWorkflowInstanceAction`). Render `WorkflowInstanceView`. Use Suspense.
        - `app/(protected)/workflows/instances/_components/workflow-instance-view.tsx`: Client component. Receives initial instance data. Visualizes workflow graph (e.g., using `reactflow` read-only). Displays node statuses from `nodeStatuses` field. Implement polling (e.g., `useSWR` with refresh) or SSE (more complex) to get status updates by re-fetching `getWorkflowInstanceAction`. Display outputs/links to documents for completed nodes. Implement Retry button calling `retryWorkflowNodeAction`.
    - **Step Dependencies**: Step 7.2, Step 7.3, Step 7.5 (reuse visualization parts)
    - **User Instructions**: Consider performance implications of polling vs. SSE for real-time updates. Start with polling.

- [ ] Step 7.8: Add Analytics for Workflows
    - **Task**: Integrate PostHog tracking for workflow creation and execution.
    - **Files**:
        - `app/(protected)/workflows/_components/workflow-editor.tsx`: Call `posthog.capture('workflow_template_created')` on successful save (new).
        - `app/(protected)/workflows/_components/workflow-run-form.tsx`: Call `posthog.capture('workflow_instance_run_started', { templateId: ... })` when run is initiated.
        - `actions/workflow-actions.ts`: In `runWorkflowInstanceAction`, capture `posthog.capture('workflow_instance_run_completed', { templateId: ..., status: 'completed' | 'failed' })` when workflow finishes.
    - **Step Dependencies**: Step 0.5, Step 7.5, Step 7.6, Step 7.3
    - **User Instructions**: None

## Phase 9: Testing (Conceptual Steps)

- [ ] Step 9.1: Setup Testing Framework
    - **Task**: Configure Vitest/Jest and React Testing Library. Add basic test scripts to `package.json`.
    - **Files**: `vitest.config.ts` or `jest.config.js`, `package.json`
    - **User Instructions**: Install dev dependencies: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom` (or Jest equivalents).

- [ ] Step 9.2: Write Unit Tests for Actions
    - **Task**: Create `*.test.ts` files for server actions. Mock dependencies (DB, LLM, Clerk `auth`). Test validation, logic, return values, error handling.
    - **Files**: `actions/db/*.test.ts`, `actions/*.test.ts`
    - **User Instructions**: Follow Vitest/Jest mocking guides.

- [ ] Step 9.3: Write Integration Tests for Components
    - **Task**: Create `*.test.tsx` files for key client components (modals, forms, interactive elements). Use RTL to render, simulate events, mock server actions, verify UI updates.
    - **Files**: `components/**/*.test.tsx`, `app/**/*.test.tsx`
    - **User Instructions**: Focus on testing component logic and interaction with mocked actions.

- [ ] Step 9.4: Setup E2E Testing Framework
    - **Task**: Configure Playwright. Add base config and example test structure.
    - **Files**: `playwright.config.ts`, `tests/` directory
    - **User Instructions**: Install Playwright: `npm install -D @playwright/test`, `npx playwright install`.

- [ ] Step 9.5: Write E2E Tests for Critical Flows
    - **Task**: Implement Playwright tests covering sign-up, prompt creation, document generation, workflow execution.
    - **Files**: `tests/*.spec.ts`
    - **User Instructions**: Requires setting up a test environment (seeding DB, potentially mocking external services).
