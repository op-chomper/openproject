# Design — Read-only mode for Documents

## Where this fits in the existing code

The collaborative document view is rendered by `DocumentsController#show`
(`modules/documents/app/controllers/documents_controller.rb:58`) →
`documents/show.html.erb` →
`Documents::ShowEditView::BlockNoteEditorComponent`. That component lays out
a page header and the editor and already threads a boolean **`readonly`**
all the way to the editor and the attachments panel:

- `BlockNoteEditorComponent` (`block_note_editor_component.html.erb:78`)
  passes `readonly:` into `Documents::BlockNoteEditorForm`, and into
  `AttachmentsSidePanelComponent` (`:87`).
- `BlockNoteEditorForm` forwards it to the `block_note_editor` form input
  (`modules/documents/app/forms/documents/block_note_editor_form.rb:38`).
- The Primer `BlockNoteEditor` renders it as the `read-only` attribute of
  the `<op-block-note>` custom element
  (`lib/primer/open_project/forms/block_note_editor.html.erb:40`).
- The custom element passes it to React as `readOnly`
  (`frontend/src/elements/block-note-element.ts:119`), which becomes
  `editable={!readOnly}` on `<BlockNoteView>`
  (`frontend/src/react/components/OpBlockNoteEditor.tsx:146`).
- `AttachmentsSidePanelComponent#allow_uploading?` returns `!readonly`
  (`attachments_side_panel_component.rb:46`).

Today `@readonly` is set only from the OAuth token metadata, and the token
service derives it purely from permissions: `true` for a viewer who is not a
manager, `false` for a manager
(`token_with_metadata_service.rb:91-94`). **The whole read-only pathway
already exists; this change adds a user-controlled input to it.**

## Core approach

Introduce a document-view **mode** with two values — `reading` (default) and
`editing` — that is distinct from, and combined with, the user's edit
permission:

```
editor_readonly = !user_can_edit? || mode == :reading
```

where `user_can_edit?` mirrors the token service's existing rule
(`allowed_in_project?(:manage_documents, project)`; the OAuth token remains
the server-side source of truth for non-editors). This preserves current
behaviour for viewers (always read-only, no toggle) and makes Reading the
default for editors.

### Decision: client-side reactive toggle, no reconnect (recommended)

`<BlockNoteView editable=…>` is a reactive prop — BlockNote can flip
editability on a live editor without recreating it. Recreating the editor is
explicitly avoided in this codebase because it tears down the Yjs
`UndoManager` and the Hocuspocus WebSocket
(`OpBlockNoteEditor.tsx:126-130`, `documents/show.html.erb:36-41`).

Therefore the toggle should flip editability **in place**:

1. A Stimulus controller on the page header owns the mode and, on change,
   updates the `read-only` attribute of the `<op-block-note>` element (and a
   read-only flag on the attachments panel and title affordances).
2. `BlockNoteElement` observes `read-only` via `attributeChangedCallback`
   (add it to `observedAttributes`) and re-renders its React root with the
   new `readOnly` value, so `editable` updates without a new editor.

This keeps the collaboration session alive across mode switches and is the
approach the requirements are written against.

**Reviewer check — fallback.** A server round-trip is possible instead: a
`mode`/`state` query param re-rendered by the controller
(`derive_show_edit_state_from_params` already reads `params[:state]`,
`documents_controller.rb:236`). It is simpler but reloads the page and
reconnects the editor on every switch, producing the transient offline
banner the `turbo-cache-control: no-cache` meta was added to avoid. Prefer
the in-place toggle; fall back only if reactive re-render proves infeasible.

### Decision: reuse `readonly`, keep `mode` separate from header `state`

The page header already has a `state` option (`:show` / `:edit`) that governs
**inline title editing** (`page_header_component.rb:40`, driven by
`edit_title`/`cancel_title_edit`). That is a different axis from the new
reading/editing mode and MUST NOT be conflated — name the new concept `mode`
(or `editing_mode`) to avoid collisions. The mode feeds the existing
`readonly` boolean rather than introducing a parallel flag.

## Decisions where the intake is silent

The intake is one paragraph; it specifies the control (a radio switch,
Reading/Editing, Reading default) and nothing else. The following were
decided here and should be confirmed in review:

- **Who sees the toggle.** Only users allowed to edit
  (`manage_documents`). Viewers have nothing to switch to, so the toggle is
  **not rendered** for them; they remain read-only exactly as today. The
  intake does not mention permissions.
- **What Reading mode locks.** For a coherent "read-only lock," Reading mode
  disables *all* content-modifying affordances in the collaborative view:
  the body editor, the attachment upload/delete actions (already keyed off
  `readonly`), and the inline title-edit affordances (the pencil action-menu
  item and the editable title form). The intake says "read-only lock for
  Documents" without enumerating surfaces.
- **Persistence.** The mode is **ephemeral per page load** and resets to
  Reading on every open. The intake calls Reading "the default … so the user
  has to click … to go into edit mode," which reads as default-on-open.
  Remembering the last choice (via param, cookie, or user preference) is
  explicitly out of scope.
- **Concurrent editors.** The mode is per-user and local; it does not lock
  the document for other collaborators and is not broadcast over the
  collaboration channel. One user reading while another edits is expected.
- **Classic (non-collaborative) documents.** Untouched — they have a
  separate `edit` action and no BlockNote editor. The toggle appears only in
  the collaborative view, and only when
  `Setting.real_time_text_collaboration_enabled?` is true.

## UI

Use a Primer segmented control (`Primer::Alpha::SegmentedControl`) with two
items, **Reading** and **Editing**, placed in the document page header
(`Documents::ShowEditView::PageHeaderComponent`). A segmented control is the
Primer idiom for the "radio button switch" the intake describes and is
already used elsewhere in the product (e.g.
`OpPrimer::QuickFilter::SegmentedControlComponent`). New user-facing strings
go under `documents.page_header.*` in
`modules/documents/config/locales/en.yml`.

## Risks

- **Attribute-observer re-render.** Re-rendering the React root on
  `attributeChangedCallback` must not recreate the BlockNote editor or drop
  the Hocuspocus provider; follow the existing single-editor-per-mount
  guidance in `OpBlockNoteEditor.tsx`.
- **Not a security control.** As stated in the proposal's non-goals, Reading
  mode must not be relied on to prevent edits by users who lack permission —
  that remains the OAuth token's job.
