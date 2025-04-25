# Comprehensive UX/UI Design Document

Below is the entire design document from before, with edits to incorporate your new comments. All original text remains intact for integrity, and the new clarifications are **bolded** within each relevant milestone section.

## High-Level UI/UX Design Philosophy

This product emphasizes a sleek, modern interface with smooth animations and intuitive interactions. The visual approach draws inspiration from high-quality AI platforms, aiming for a polished and professional look.

### Typography

- **Primary Font:** "Inter," "Roboto," or "SF Pro Text" (modern humanist sans-serif).
- **Secondary Font:** "Poppins" or similar, used sparingly for headings or emphasis.
- **Hierarchy & Sizing:**
    - **H1:** 32–40px, **Bold**, 1.2 line-height
    - **H2:** 24–28px, **Semi-Bold**, 1.3 line-height
    - **H3:** 20–24px, **Medium**, 1.3 line-height
    - **Body:** 16px, **Regular**, 1.5 line-height
    - **Small Text/Caption:** 14px, **Regular**, 1.4 line-height

### Layout & Grid System

- **Desktop:** 12-column layout, 20–24px gutters.
- **Mobile/Tablet:** 4–8 columns, condensed menu (hamburger).
- **Spacing:** Multiples of 8px for margins, paddings, and consistent vertical rhythm.
- **Responsive Adaptation:** Scalable typography, reorganized columns, clear focus on usability for both desktop (primary) and mobile scenarios.

### Accessibility & Responsiveness

- **Contrast Ratios:** Meet WCAG AA (4.5:1 for text).
- **Focus States:** Clearly visible outlines for keyboard navigation.
- **Color Independence:** Use icons/text labels along with color cues.
- **Dynamic Font Sizing:** Layouts accommodate enlarged text gracefully.
- **Touch Targets:** Minimum 44px height for interactive elements on mobile.

### Common UX/UI Patterns

- **Sidebar Navigation:** Persistently visible on desktop for quick access.
- **Modal Windows:** Used for task-focused user flows (creation/editing) without losing context (although see Milestone 6 clarification below).
- **Skeleton Loading:** Display placeholders before real content arrives.
- **Friendly Error Messages:** Casual, approachable tone with suggestions or next steps.
- **Smooth Transitions:** Framer Motion for refined animations on page transitions and interactive elements.
- **Empty States:** Encourage user action with simple instructions or illustrations when lists are empty.

## Milestone-Based Feature Implementation

Below are six milestones, each delivering a usable slice of functionality. Every milestone is broken down into:

- Overview
- Pages & Components
- Detailed User Stories
- Detailed Acceptance Criteria
- Technical Implementation Notes
- UX/UI Patterns

Each milestone is designed to provide immediate value while laying the groundwork for subsequent enhancements.

---

### 🚩 Milestone 1: Prompt Creation & Optimization

#### 1. Overview

Users need a quick way to create and optimize AI prompts, ensuring the final "optimized prompt" is highly effective for generating desired content. This milestone introduces a simple flow for users to enter a raw prompt, automatically refine it via LLM, then save it for future reuse.

**However, these "prompts" are effectively prompt templates. They will include placeholders (`{{user_input}}`) where user input will later be injected at document generation time. This ensures the template can remain flexible for any product or scenario.**

**Additionally, the user must be able to set the default LLM provider (Models from OpenAI, Anthropic, or Grok) that will be used for future document generation via this prompt template. The LLM that refines the prompt in this milestone is a separate back-end system prompt you maintain and does not affect the user's chosen provider for document generation.**

**Lastly, we will auto-name the prompt by sending the user's raw (non-optimized) prompt to an LLM to generate a title. This title can be edited by the user if desired.**

#### 2. Pages & Components

**Prompts Page**

- **Primary Action:** "Create a New Prompt" (prominent gradient button).
- **Prompts List:** Displays a list of recent prompts (title, timestamp, default LLM).
- **Empty State:** Friendly illustration or text inviting user to create their first prompt.

**Prompt Creation Modal**

- **Text Fields:**
    - Textarea for basic prompt input.
    - Display area for the optimized/refined prompt ensuring to include future inputs `{{user_input}}`.
    - Auto-Generated Title from an LLM that returns a short descriptive name for the prompt.
    - LLM Selection Dropdown: Allows the user to pick a default LLM (models from OpenAI, Anthropic, or Grok) for document generation.
- **Buttons:**
    - "Optimize Prompt": Calls the LLM to refine the user's text (using your back-end system prompt).
    - "Save Prompt": Persists the final refined prompt template, the title, and the chosen default LLM to the database.
    - "Cancel": Closes modal without changes.

#### 3. Detailed User Stories

**Creating and Optimizing a Prompt Template with Placeholders**

- As a user, I can navigate to the Prompts page and see a button labeled "Create a New Prompt."
- When I click this button, a modal appears with a textarea where I can enter my raw prompt, including placeholders such as `{{user_input}}`.
- I press "Optimize Prompt," and a loading animation (spinner or skeleton) indicates processing by the LLM (using a specialized back-end system prompt you maintain).
- After processing, an "Optimized Prompt" is displayed. I can further edit or fine-tune this text.
- An auto-generated title for my prompt template appears, which I may also edit if I want.
- I select which LLM model (OpenAI, Anthropic, or Grok) should be the default for future document generation with this prompt.
- I press "Save Prompt," which stores the new prompt template (with placeholders), the auto-generated (or user-edited) title, and the default LLM. The Prompts page list updates immediately.

#### 4. Detailed Acceptance Criteria

- **Modal Interaction:** The prompt creation modal must open smoothly, overlay the page, and close on demand.
- **LLM Processing for Optimization:** When "Optimize Prompt" is clicked, a loading state is clearly visible until the result is returned.
- **Placeholders:** The user can insert placeholders (like `{{product_name}}`) in the prompt template for future input injection.
- **Auto-Generated Title:** The system calls an LLM to propose a descriptive name for the prompt; user can override it.
- **Default LLM Selection:** A dropdown or similar control allows choosing the default LLM for document generation. This setting is saved alongside the prompt.
- **Persistence & List Update:** Once saved, the new prompt appears at the top of the recent prompts list with its default LLM indicated.
- **Empty State Handling:** If no prompts exist, a friendly message or illustration is shown instead of a list.

#### 5. Technical Implementation Notes

- **Frontend:** Next.js with a modal component (e.g., Shadcn/ui), calling a server action for LLM optimization and prompt title generation.
- **Backend:** Drizzle ORM + Supabase for storing prompts. Each record includes the optimized text, placeholders if any, auto-generated title, and default LLM model.
- **System Prompt vs. User's Default LLM:** The prompt-optimization step uses a specialized back-end system LLM prompt. The user's selected LLM is for later document generation.
- **Animation:** Use Framer Motion or Tailwind transitions for loading feedback in the modal.

#### 6. UX/UI Patterns

- **Consistent Modal Layout:** A standardized modal design to be reused in future features.
- **Gradient CTA Button:** "Create a New Prompt" uses a bold gradient style to attract clicks.
- **Optimized Prompt Field:** Separated visually from raw input for clarity.
- **Auto-Generate Title:** On first optimization, the system displays an LLM-generated name in a small title input field.
- **Skeleton or Spinner:** Clear loading state while LLM processes data.

---

### 🚩 Milestone 2: Document Generation

#### 1. Overview

Users will generate documents based on saved prompt templates, providing additional input (context or custom data) to fill placeholders such as `{{product_name}}` or `{{user_input}}`. They can also see or change the default LLM model for this generation. A new document will be created and stored, allowing them to copy or download the finished text.

**Additionally, there should be a direct pathway from the Prompts page to start document generation. For example, if a user is reviewing a prompt template, they can click "Generate Document" right there and be routed to the document generation flow.**

#### 2. Pages & Components

**Documents Page**

- **Primary Action:** "Generate Document" button.
- **Recent Documents List:** Shows titles, timestamps, and references to the prompt used.
- **Empty State:** Encourages user to generate their first document.

**Generate Document Modal**

- **Prompt Selection:** Users can select an existing prompt template from a dropdown (or arrive here directly from the prompt page).
- **LLM Model Display & Edit:** The chosen prompt's default LLM is shown. The user can switch to a different model for a one-off generation, with an option to "Update Prompt's Default LLM" or proceed with a temporary override.
- **Placeholder Inputs:** For each placeholder in the prompt (e.g., `{{product_name}}`), a field is displayed to capture user-specific data.
- **Button:** "Generate" triggers the LLM to create a document.

**Generated Document View**

- **Display:** A read-only text area or nicely formatted content area. **When a user clicks into the text-area they should be able to directly edit the content.**
- **Buttons:** "Copy," "Download," and "Save" to store the document in the database.

#### 3. Detailed User Stories

**Generating a Document with a Prompt Template**

- As a user, I open the Documents page and see "Generate Document."
- I click the button and choose from a list of saved prompts (or create a new one).
- I see the default LLM model for that prompt displayed. I may change it for this particular document; if I do, I can choose whether to update the prompt's default or just use the new model one time.
- For each placeholder in the prompt template (e.g., `{{product_name}}`), I input the relevant value.
- I click "Generate," and a loading state indicates LLM processing.
- The newly generated document appears, and **I click into it and edit it.**
- From there I can copy or download it.
- Once saved, it is added to the Recent Documents list automatically.

**Generating a Document from the Prompt Page**

- While viewing a prompt template on the Prompts page, I click "Generate Document."
- This either opens the "Generate Document" modal (or navigates to a dedicated flow) with the current prompt already selected.
- The rest of the flow is the same as above, including placeholders and LLM model selection.

#### 4. Detailed Acceptance Criteria

- **Prompt Template Support:** The system should detect placeholders and prompt the user for each one.
- **LLM Model Handling:**
    - Display the current default LLM from the prompt.
    - Allow user to change it for a single generation or update the prompt's default model permanently (prompting a confirmation dialog).
- **One-Click from Prompt:** A "Generate Document" button on the prompt page should link directly into the generation flow, pre-selecting that prompt.
- **Data Persistence:** Generated documents automatically save or can be explicitly saved, then appear in the documents list.
- **Copy/Download:** Document must be easily copied or downloaded.

#### 5. Technical Implementation Notes

- **Frontend:** Reuse modal patterns from Milestone 1, but expand to handle placeholders and LLM selection logic.
- **Backend:** Drizzle ORM to store document metadata (title, associated prompt, creation date, LLM used).
- **LLM Integration:** Uses the user's chosen model for the text generation step; placeholders are replaced with user inputs server-side before sending to the LLM.
- **Performance:** Use skeleton loading or spinners to handle potential latency from large LLM calls.

#### 6. UX/UI Patterns

- **Consistency with Prompts:** A similar gradient button style for "Generate Document."
- **Prompt Template Fields:** Dynamically rendered form fields for each placeholder.
- **Empty State & Quick Tips:** "No documents yet. Let's generate one!" with helpful instructions.

---

### 🚩 Milestone 3: Context Snippet Management

#### 1. Overview

Users frequently reuse context (like company details) in multiple documents. This milestone introduces snippet management (create, edit, delete). **However, snippet content should only be inserted at document generation time, to avoid storing stale data in the prompt template itself. Instead of physically inserting snippet text into the prompt, we store placeholders referencing the snippet. When a document is actually generated, the snippet's most up-to-date text is injected.**

#### 2. Pages & Components

**Context Page**

- **Primary Action:** "Create Context Snippet" button.
- **Snippet List:** Shows snippet name, summary, date created/updated.
- **Empty State:** Encourages the user to add their first snippet.

**Create/Edit Context Modal**

- **Fields:** Name of snippet (e.g., `@company-info`), text content.
- **Buttons:** "Save," "Cancel" for CRUD operations.

**Hover Summary for Snippet Placeholders**

- When users see a snippet placeholder (e.g., `@company-info` or some structured reference) in a prompt or document preview, hovering over it can show a summary or preview of the snippet text. A quick link could allow editing that snippet if needed.

#### 3. Detailed User Stories

**Managing Context Snippets**

- As a user, I visit the Context page to view existing snippets or create new ones.
- I can click "Create Context Snippet" to open a modal. I enter a name (`@company-info`) and text content (company's key data).
- I save, and the snippet appears in the snippet list with a timestamp.
- When using a prompt template or generating a document, I do not see the full text physically inserted in the prompt. Instead, a placeholder (`@company-info`) is included, and the system will insert the snippet in real time at generation.
- If I hover over the snippet placeholder at any point, I see a brief summary or excerpt. I can also jump to editing the snippet from there if needed.

#### 4. Detailed Acceptance Criteria

- **Snippet CRUD:** Must reliably create, edit, and delete context snippets with immediate UI updates.
- **Real-Time Insertion:** The final LLM call at document generation time merges the latest snippet text in place of the placeholder, so it is always up to date.
- **No Prompt Text Overwrite:** Prompts should store only placeholders, never a static copy of the snippet text.
- **Hover Preview:** A short summary or popover visible on hover, with an edit link for convenience.

#### 5. Technical Implementation Notes

- **Frontend:** Possibly use a small popover library or built-in tooltips for snippet hover previews.
- **Backend:** Drizzle ORM table for "ContextSnippets" includes snippet text, name, updated timestamp.
- **Document Generation Flow:** During the final step (Milestone 2's process), placeholders like `@company-info` are replaced with the snippet's current text.

#### 6. UX/UI Patterns

- **Modal Reuse:** The same consistent style for snippet creation/edit as with prompts/documents.
- **Friendly Empty States:** "No context snippets yet. Create one to quickly add your frequently used info."
- **Hover/Tooltip Design:** Minimal yet informative snippet summaries. Possibly show "Edit Snippet" link in the tooltip.

---

### 🚩 Milestone 3.1: Snippet Autocomplete Insertion in Prompt Editor

#### 1. Overview

Users should be able to insert Context Snippets directly while composing or editing a prompt template (Milestone 1) without leaving the editor. Typing `@` triggers an inline autocomplete menu that filters snippets in real time. Selecting (`Tab`, `Enter`, or click) inserts the snippet placeholder (`@company-info`, etc.) as a **blue-highlighted token**, making it visually distinct from ordinary text. This streamlines authoring and guarantees that prompts always reference the latest snippet content (defined in Milestone 3).

#### 2. Pages & Components

| Area                        | Additions / Changes                                                            |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Prompt Creation Modal**   | • Rich-text editor upgraded with token support and inline autocomplete.        |
| (Milestone 1)               | • Snippet tokens render as pill-shaped, blue badges (e.g., `@company-info`).   |
| **Prompt Edit View**        | Same enhanced editor, ensuring consistency across create & edit flows.           |
| **Autocomplete Dropdown**   | • Appears under caret when user types `@`.                                     |
|                             | • Live-filters as additional characters are typed.                             |
|                             | • Keyboard navigation (`↑`/`↓`). Current item is highlighted.                  |

#### 3. Detailed User Stories

**Inserting a Context Snippet via Auto-Complete**

- As a power user creating or editing a prompt template,
- I want to type `@` and immediately see a dropdown of my saved context snippets,
- so that I can quickly reference reusable information without memorizing exact names.

- If I continue typing, the list filters to matching snippet names.

- Using `↑`/`↓` selects items; pressing `Tab` or `Enter` inserts the highlighted snippet as a **blue token**.

- The token remains editable (double-click opens rename flow) and can be deleted like ordinary text without breaking layout.

#### 4. Detailed Acceptance Criteria

**Trigger & Filtering**

- Autocomplete opens **< 100 ms** after `@` is typed.
- List filters client-side with every keystroke; must handle **≥ 100 snippets** without lag.

**Keyboard & Mouse Support**

- `↑`/`↓` to move, `Esc` to dismiss, `Tab`/`Enter` or click to insert.
- Focus management meets WCAG 2.1 – focus ring clearly visible.

**Token Rendering**

- Inserted placeholder displays as **blue pill** (background `#E0F2FF`, text `#0369A1` or theme equivalent).
- Token text = snippet name (e.g., `@company-info`).
- On hover, show snippet summary tooltip (Milestone 3).

**Data Integrity**

- Editor stores only the placeholder string in the database, not the resolved snippet text.
- Deleting a token removes the placeholder without residual markup.

**Error Handling**

- If no snippets match, show "No results" with option "Create new snippet" (opens Create Context Modal).

#### 5. Technical Implementation Notes

- **Editor Choice:** Upgrade `textarea` to a lightweight rich-text/CodeMirror instance with token & autocomplete extensions.
- **Token Schema:** Represent snippet tokens as atomic nodes; serialize to plain text `@snippet-name` for storage.
- **Autocomplete Data:** Fetch snippet names once on modal open; keep in memory for instant filtering.
- **Styling:** Tailwind utility classes (`bg-sky-100 text-sky-700 rounded px-1.5 py-0.5`) and dark-mode variants.
- **Accessibility:** ARIA `role="listbox"` for dropdown, `option` for items; announce current selection via `aria-live="polite"`.

#### 6. UX/UI Patterns

- **Inline Suggestions:** Mirrors modern IDE/email "mention" UX, reducing cognitive load.
- **Color Consistency:** Blue token matches snippet hover color from Milestone 3 to reinforce mental model.
- **Create-from-Autocomplete:** Quick-add shortcut fosters snippet creation without breaking writing flow.
- **Smooth Animations:** Fade & slide dropdown (Framer Motion, 150 ms) for polished feel, minimal distraction.

---

### 🚩 Milestone 4: Real-Time Document Editing via AI Chat

#### 1. Overview

Once a user generates a document, they may want to refine or restructure it. This milestone provides a chat-like interface to issue direct commands to the AI, updating the document live (e.g., removing a section, turning paragraphs into bullet points).

#### 2. Pages & Components

**Enhanced Document View**

- **Main Document Display:** Readable text area showing the current version of the document.
- **AI Chat Sidebar:** A chat panel that shows user commands and AI responses.

**Chat Interaction & Edit History**

- **User Input Field:** Enter instructions to modify the document.
- **AI Response Display:** Shows how the document was changed.
- **Document Preview Updates:** Real-time reflection of the changes made by the AI.

#### 3. Detailed User Stories

**Live Editing a Document**

- As a user, I open a previously generated document in the "Enhanced Document View."
- I see a chat sidebar where I can type instructions like "Remove the last section" or "Convert the introduction to bullet points."
- Upon hitting "Send," the AI processes the command, modifies the text, and the updated version immediately appears in the main document display.
- Each AI response is added to the sidebar, providing a history of all edits.

#### 4. Detailed Acceptance Criteria

- **Seamless Real-Time Edits:** The main document view must refresh instantly to reflect changes.
- **Chat Logs:** Show a chronological record of user commands and AI responses.
- **Error Handling:** If an AI request fails, display a friendly, casual error message with a retry option.
- **Document Persistence:** Edits must be retained if the user navigates away or triggers a "Save" action.

#### 5. Technical Implementation Notes

- **Frontend State:** Possibly keep the live document in an in-memory state for immediate updates, then sync with server actions.
- **LLM Calls:** Similar abstracted approach, but specifically for real-time editing.
- **Diff or Patch Approach:** The AI returns either a full updated document or a patch that can be applied to the existing text.

#### 6. UX/UI Patterns

- **Split-Screen Layout:** Document on the right, chat sidebar on the left for clarity.
- **Smooth Animations:** Chat messages and changes fade in or animate for a refined feel.
- **Focus on Readability:** The updated text should never jump or scroll unpredictably; ensure minimal layout shifts.

---

### 🚩 Milestone 5: AI-Powered Prompt Improvement via Diff Comparison

#### 1. Overview

When a user finishes editing a document via AI chat, they can finalize it. This milestone allows the system to compare the original prompt (template) with the final edited output to see what changed. **Rather than showing a diff of the document itself, the LLM suggests how to modify the original prompt so future output better matches the final edited version—but still preserves any placeholders or template logic.**

#### 2. Pages & Components

**Prompt Improvement Modal**

- **Trigger:** Opens automatically when a user copies or otherwise finalizes a document that has gone through chat-based edits.
- **Recommended Prompt Changes:** Instead of showing a doc diff, the system calls the LLM with:
    - The original prompt template (including placeholders).
    - A summary of the user's edits or the final doc output.
    - The LLM's goal is to produce an updated version of the prompt template that yields final docs closer to the user's actual end result.
- **Buttons:** "Accept & Overwrite," "Save as New Prompt," or "Dismiss."

#### 3. Detailed User Stories

**Refining a Prompt Template via AI Feedback**

- As a user, I finalize an edited document by copying or saving the final version.
- A modal opens, showing how the LLM recommends changing my original prompt to achieve a closer result to the final doc, while maintaining placeholders (e.g., `{{product_name}}`) and avoiding instance-specific data.
- I decide whether to overwrite the old prompt or save a new, separate prompt template with these improvements.

#### 4. Detailed Acceptance Criteria

- **Focus on Prompt Diff:** The user sees recommended changes to the prompt's text, not the entire document's final text.
- **Maintaining Template Integrity:** The placeholders (`{{...}}`) must remain intact; the LLM must not replace them with any instance-specific data.
- **No Document Diff Display:** We only care about how to alter the original prompt's style, structure, or approach to get closer to the final user-approved doc.
- **User Control:** Option to overwrite existing prompt or save a new version without losing the old one.

#### 5. Technical Implementation Notes

- **Diff Generation:** The product may rely on a simple LLM approach, which sees the final doc changes and returns a recommended updated prompt template.
- **Prompt Storage:** Must track original prompt text for accurate improvements.
- **Decision Handling:** If the user chooses "Save as New Prompt," store it with a new ID. Overwrite modifies the existing prompt in place.

#### 6. UX/UI Patterns

- **Modal Display:** Provide a clear textual comparison or highlight of new prompt lines.
- **Clear Language:** "Based on your final edits, here's how we can improve your original prompt template. We preserved all placeholders for future use."
- **Consistent Buttons:** Overwrite vs. New Prompt remain consistent in design to avoid confusion.

---

### 🚩 Milestone 6: Workflow Automation (Detailed UX/UI Design)

#### 1. Overview

Workflows enable users to chain multiple prompts/documents in a sequence. The output from one step becomes the input to the next. Users can visualize these chains, track execution status, and easily reuse or edit workflow templates for recurring tasks. **Each workflow can be executed multiple times, generating distinct workflow instances with unique user inputs.**

#### 2. Pages & Components

**Workflows Page**

- **Primary Actions:**
    - "Create Workflow" (gradient primary button).
- **Workflow List:**
    - Displays existing workflow templates with name/title, status (if a template can have a "last run" or "no runs yet"), last updated timestamp.
    - Actions: Edit, Duplicate, Delete, Run (to create a new workflow instance).
- **Empty State:** Friendly illustration and a prompt to create the first workflow.

**Workflow Instance List:**
- Displays individual instances of workflow execution with Name of the instance, date of instance generation, and the workflow template that was used
- Actions: View workflow instances

**Workflow Creation/Editing (Full Page)**

- **Full-Page Workspace:** Since workflows can be extensive, creation/editing should occupy the full page width **rather than a small modal.**
- **Nodes Representing Each Prompt/Document Step:**
    - Drag-and-drop to reorder nodes with intuitive snapping.
    - Node selection referencing existing prompt templates (with placeholders).
- **Save Workflow Template:** After building the node sequence, saving it to the database for future usage.

**Workflow Template View**

- **Visualization of Nodes:**
    - Each node labeled with the prompt template or relevant step.
- **Edit Button:** Allows user to re-enter the full-page workflow editor.
- **Run Button:** Initiates a new workflow instance using the template.

**Workflow Execution/Instance Page**

- **Real-Time Workflow Execution Visualization:**
    - Animated progress for each node (pulsing border or highlighted step).
    - Node Status: Running, Pending, Failed, Completed.
- **Clicking on a Node:** Shows details of inputs used, outputs generated, and references to prompt placeholders.
- **Failure Handling:** Friendly error message and a retry or skip mechanism.

**Workflow Instance List**

- For each template, there may be multiple past runs (instances):
    - The instance is titled or timestamped ("SQL AI Builder Run on 2025-03-25").
    - Clicking an instance opens the final chain of outputs for that run.

#### 3. Detailed User Stories

**Creating a Workflow Template**

- As a user, I click "Create Workflow," and a full-page editor appears with a blank canvas or step list.
- I add nodes in a sequence (e.g., PRD prompt → Focus Group prompt → GTM prompt).
- I drag and drop nodes to define the flow, specifying how outputs from one node feed the next node's placeholders.
- I save the workflow, which now appears in the workflow templates list.

**Running a Workflow (Creating an Instance)**

- From the list of workflow templates, I click "Run."
- The system prompts me for any placeholders needed in the first node (e.g., `{{product_name}}` = "SQL AI Builder").
- After submission, a new workflow instance is created, displayed in real-time as each node processes the output of the prior node.
- Once a node finishes, I can click to view that step's generated document. If a node fails, I see a friendly error with a retry option.

**Viewing Past Workflow Instances**

- I can open a workflow template page and see all instances that have been run.
- Each instance is labeled by date/time or user-defined name.
- Clicking an instance lets me see all generated documents and statuses for that run.
- **Or I can access an instance direct from the workflows page where we display the list of runs (E.g. SQL AI builder, date, and the workflow template used)**

**Editing a Workflow Template**

- At any time, I can revisit the workflow template list and select "Edit" on a particular template.
- The full-page editor reopens, allowing me to add, remove, or reorder nodes.
- Saving updates the template for future runs but does not retroactively change past instances.

#### 4. Detailed Acceptance Criteria

- **Workflow Template Creation/Editing:**
    - Full-page layout that is intuitive for multi-step flows.
    - Drag-and-drop node arrangement is clear, with lines or arrows showing output → input.
    - Template is saved once the user finalizes the layout.
- **Executing a Workflow (Instance Runs):**
    - Upon starting a run, user is prompted for any placeholders in the nodes (like `{{product_name}}`).
    - Each node transitions from Pending to Running to Completed or Failed with animations or clear status icons.
    - Real-time updates show which node is active at any moment.
    - Documents generated by each node are stored in the general documents repository, labeled by workflow instance and node.
- **Multiple Instances & History:**
    - The user can run the same template multiple times with different inputs. Each run is stored as a separate instance.
    - Past instances are viewable, with timestamps or user-defined labels to differentiate them.
- **Chaining Outputs as Inputs:**
    - The UI clearly maps outputs from Node A to placeholders in Node B, etc.
    - If multiple inputs are required, the UI visually aggregates them.
- **Error Handling and Retry:**
    - Failures generate friendly notifications with reasons.
    - Retry logic is one-click from the failure message or node, continuing from that step onward.
- **Persistent Storage & Versioning:**
    - Each node's output is stored as a new document record.
    - Workflows are stored as templates; runs are separate instances referencing the template.

#### 5. Technical Implementation Notes

- **Backend:** Use Next.js server actions for orchestrating each workflow node. Drizzle ORM + Supabase for robust relationship mapping (e.g., Node 1 output → Node 2 placeholders). Distinguish workflow "templates" from "instances."
- **Frontend State:** Possibly maintain a real-time state of workflow progress using dynamic server updates or websockets for immediate feedback (if needed).
- **LLM Provider Abstraction:** The same approach used in earlier milestones, but extended for multi-step chaining with placeholders.
- **Scalability:** Carefully handle large workflows or complex chaining with minimal performance overhead.

#### 6. UX/UI Patterns

- **Full-Page Editor for Creation:** Replaces the concept of a smaller modal to accommodate complex workflow building.
- **Animated Workflow Visualization:** Use lines/arrows to connect nodes, with subtle color changes to show progress.
- **Consistent Error Messaging:** Retain a casual tone while giving clear reasons for any node's failure.
- **Template vs. Instance Concept:** Clear UI delineation between the reusable "workflow template" and each "workflow run."

---

## Conclusion

This document outlines each milestone in full detail, integrating your additional requirements:

- **Milestone 1:** Prompt templates with placeholders, default LLM selection, auto-naming.
- **Milestone 2:** Document generation with placeholders, LLM model overrides, direct link from prompt pages.
- **Milestone 3:** Context snippets stored separately, inserted only at generation, hover summaries.
- **Milestone 4:** Live AI chat editing for existing documents.
- **Milestone 5:** Prompt-improvement recommendations focusing on adjusting the template rather than a document diff.
- **Milestone 6:** Workflow templates vs. workflow instances, full-page workflow creation, multi-run tracking.

By following this structured, iterative approach, your platform will evolve into a robust, user-friendly AI workflow solution. Each milestone delivers immediate value while laying a foundation for subsequent enhancements, ensuring a Minimum Lovable Product at every stage.

