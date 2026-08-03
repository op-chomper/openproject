## Why

Collaborative documents (the BlockNote/Hocuspocus editor in a project's
*Documents* module) open directly editable for anyone holding
`manage_documents`, so the caret is live the moment the page loads and any
stray keystroke, paste, or drag edits shared content in real time for every
connected collaborator. There is no way for someone who *can* edit to open a
document deliberately just to read it — the only read-only experience today is
a side effect of *lacking* edit permission. The intake (Document #317,
"Read-only mode for Documents") asks for a read-only lock users can turn on
and off, shown as a switch with the values **Reading** and **Editing** where
**Reading is the default**.

## What Changes

- Add a **Reading / Editing** toggle at the top of the collaborative document
  view, rendered only for users who are allowed to edit the document.
- Make **Reading the default** on every page load: the document opens
  presented as read-only even for editors, who must actively choose
  **Editing** before the body becomes editable.
- Choosing **Editing** unlocks the document body and its content-modifying
  affordances (attachment upload/delete, inline title edit); choosing
  **Reading** again re-locks them — without dropping the real-time
  collaboration session or local undo history.
- Leave users who lack edit permission unchanged: always read-only, no toggle.

## Capabilities

### New Capabilities

- `document-editing-mode`: A per-user Reading/Editing mode for the
  collaborative document view that defaults to read-only ("Reading") on load
  and lets editors switch the document into an editable state, layered on top
  of — not replacing — the existing server-side permission enforcement.

### Modified Capabilities

<!-- None. There are no published specs in openspec/specs/; this change
     introduces the document-editing-mode capability rather than modifying an
     existing one. -->

## Impact

- **Documents module (collaborative view only):**
  `DocumentsController#show`
  (`modules/documents/app/controllers/documents_controller.rb:58`), which
  already sets `@readonly` from the collaboration token
  (`:226`) and derives a title `state` from params (`:236`).
- **View components:**
  `Documents::ShowEditView::BlockNoteEditorComponent` and its
  `PageHeaderComponent`, `BlockNoteEditorForm`, and
  `AttachmentsSidePanelComponent` (all already thread a `readonly` boolean).
- **Frontend custom element / React:** `<op-block-note>`
  (`frontend/src/elements/block-note-element.ts`) and `OpBlockNoteEditor.tsx`,
  which map `readOnly` to `<BlockNoteView editable>`.
- **Locales:** new user-facing strings under
  `modules/documents/config/locales/en.yml`.
- **Not affected:** classic (non-collaborative) documents; the OAuth
  collaboration token's server-side read-only enforcement for non-editors
  (`Documents::OAuth::TokenWithMetadataService#readonly`).
