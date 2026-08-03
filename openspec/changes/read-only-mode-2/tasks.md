## 1. Derive editing mode and compute editor editability (backend)

- [ ] 1.1 Introduce a document-view `mode` concept (`:reading` default,
      `:editing`) in `DocumentsController#show`, distinct from the page
      header's title `state`, defaulting to `:reading` on every load.
- [ ] 1.2 Compute `user_can_edit?` from `manage_documents` (mirroring
      `Documents::OAuth::TokenWithMetadataService`) and derive the effective
      `readonly` passed to the view as `!user_can_edit? || mode == :reading`,
      keeping viewers read-only exactly as today.
- [ ] 1.3 Thread the effective `readonly` / mode through
      `BlockNoteEditorComponent` into `BlockNoteEditorForm` and
      `AttachmentsSidePanelComponent` without changing behaviour for users who
      lack edit permission.
- [ ] 1.4 Add/extend component and request specs: viewer → read-only, no
      toggle; editor → read-only on first load (Reading default).

## 2. Reading / Editing toggle in the document page header

- [ ] 2.1 Add a `Primer::Alpha::SegmentedControl` (Reading / Editing) to
      `Documents::ShowEditView::PageHeaderComponent`, rendered only when the
      user is allowed to edit, with **Reading** selected by default.
- [ ] 2.2 In Reading mode, suppress the inline title-edit affordances (the
      pencil action-menu item and the editable title form); restore them in
      Editing mode.
- [ ] 2.3 Add user-facing strings under `documents.page_header.*` in
      `modules/documents/config/locales/en.yml` (control label, Reading,
      Editing).
- [ ] 2.4 Add a component spec: toggle present for editors, absent for
      viewers, Reading pre-selected.

## 3. Flip editability in place without reconnecting the editor (frontend)

- [ ] 3.1 Make `BlockNoteElement` observe the `read-only` attribute
      (`observedAttributes` + `attributeChangedCallback`) and re-render its
      React root with the new `readOnly` value, without recreating the
      BlockNote editor or dropping the Hocuspocus provider.
- [ ] 3.2 Add a page-header Stimulus controller that owns the current mode and,
      on change, updates the `<op-block-note>` `read-only` attribute and the
      attachments panel's editable state — no full page reload.
- [ ] 3.3 Confirm the collaboration session stays connected across switches (no
      offline banner) and Yjs undo history is preserved.
- [ ] 3.4 Add/extend a frontend test for the reactive editability toggle.

## 4. End-to-end verification

- [ ] 4.1 Add a system/feature spec (alongside
      `modules/documents/spec/features/block_note_editor_spec.rb`): an editor
      opens a collaborative document → it is read-only; switching to Editing
      makes it editable; switching back to Reading re-locks it; a viewer never
      sees the toggle and cannot edit.
- [ ] 4.2 Run rubocop, erb_lint, and eslint on all changed files.
