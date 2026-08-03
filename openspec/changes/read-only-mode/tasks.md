# Tasks — Read-only mode for Documents

## 1. Derive editing mode and compute editor editability (backend)

- [ ] Introduce a document-view `mode` concept (`:reading` default,
      `:editing`) distinct from the page header's title `state`, defaulting
      to `:reading` on every `DocumentsController#show`.
- [ ] Compute `user_can_edit?` from `manage_documents`
      (mirroring `TokenWithMetadataService`) and derive the effective
      `readonly` passed to the view as `!user_can_edit? || mode == :reading`,
      keeping viewers read-only exactly as today.
- [ ] Thread the mode/effective-`readonly` through
      `BlockNoteEditorComponent` into `BlockNoteEditorForm` and
      `AttachmentsSidePanelComponent` without changing behaviour for users
      who lack edit permission.
- [ ] Add/extend component/request specs asserting: viewer → read-only, no
      toggle; editor → read-only on first load (Reading default).

## 2. Reading / Editing toggle in the document page header

- [ ] Add a `Primer::Alpha::SegmentedControl` (Reading / Editing) to
      `Documents::ShowEditView::PageHeaderComponent`, rendered only when the
      user is allowed to edit, with **Reading** selected by default.
- [ ] Wire the control to a Stimulus controller that owns the current mode
      (do not require a full page reload to change it).
- [ ] In Reading mode, suppress the inline title-edit affordances (the
      pencil action-menu item and the editable title form) so the whole view
      reads as locked; restore them in Editing mode.
- [ ] Add user-facing strings under `documents.page_header.*` in
      `modules/documents/config/locales/en.yml` (labels for the control,
      Reading, Editing).
- [ ] Add a component spec covering: toggle present for editors, absent for
      viewers, Reading pre-selected.

## 3. Flip editability in place, without reconnecting the editor (frontend)

- [ ] Make `BlockNoteElement` observe the `read-only` attribute
      (`observedAttributes` + `attributeChangedCallback`) and re-render its
      React root with the new `readOnly` value, without recreating the
      BlockNote editor or dropping the Hocuspocus provider.
- [ ] From the page-header Stimulus controller, on mode change update the
      `<op-block-note>` `read-only` attribute and toggle the attachments
      panel's editable state, so `<BlockNoteView editable>` and the
      attachment actions reflect the mode live.
- [ ] Confirm the collaboration session stays connected across switches (no
      offline banner) and Yjs undo history is preserved.
- [ ] Add/extend a frontend test for the reactive editability toggle.

## 4. End-to-end verification and feature spec

- [ ] Add a system/feature spec (alongside
      `modules/documents/spec/features/block_note_editor_spec.rb`) covering:
      an editor opens a collaborative document → it is read-only; switching
      to Editing makes it editable; switching back to Reading re-locks it;
      a viewer never sees the toggle and cannot edit.
- [ ] Run rubocop, erb_lint, and eslint on all changed files.
