## Context

See `proposal.md` (Why) for motivation. The collaborative document view is
rendered by `DocumentsController#show`
(`modules/documents/app/controllers/documents_controller.rb:58`) →
`documents/show.html.erb` →
`Documents::ShowEditView::BlockNoteEditorComponent`, and a boolean
**`readonly`** is already threaded end-to-end:

- The controller sets `@readonly` from the collaboration token metadata
  (`documents_controller.rb:226`), and the token service derives it purely
  from permissions — `true` for a viewer, `false` for a manager
  (`Documents::OAuth::TokenWithMetadataService#readonly`,
  `token_with_metadata_service.rb:91`).
- `block_note_editor_component.html.erb` passes `readonly:` into
  `Documents::BlockNoteEditorForm` (`:78`) and
  `AttachmentsSidePanelComponent` (`:87`).
- `AttachmentsSidePanelComponent#allow_uploading?` returns `!readonly`
  (`attachments_side_panel_component.rb:46`).
- The form forwards it to the Primer `BlockNoteEditor` input, which renders it
  as the `read-only` attribute of `<op-block-note>`; the custom element
  (`frontend/src/elements/block-note-element.ts`) maps it to React `readOnly`,
  which becomes `editable={!readOnly}` on `<BlockNoteView>`
  (`frontend/src/react/components/OpBlockNoteEditor.tsx`).

The read-only pathway already exists. This change adds a user-controlled input
to it. The controller also derives a separate title `state` (`:show`/`:edit`)
from `params[:state]` (`documents_controller.rb:236`) that governs inline
title editing — a different axis that must not be conflated with the new mode.

## Goals / Non-Goals

**Goals:**

- Introduce a document-view **mode** (`reading` default, `editing`) that
  combines with the existing permission-derived `readonly` rather than
  replacing it.
- Flip editability **in place** on mode change, keeping the Hocuspocus session
  and Yjs undo history intact.
- Render the toggle only for users allowed to edit; leave viewers unchanged.

**Non-Goals:**

- Persisting the chosen mode across page loads (mode resets to Reading on each
  open).
- Broadcasting or synchronizing mode between collaborators (mode is per-user
  and local).
- Any change to classic (non-collaborative) documents or to the OAuth token's
  server-side enforcement.

## Decisions

### Combine mode with the existing `readonly`, keep it separate from `state`

Compute effective read-only as:

```
editor_readonly = !user_can_edit? || mode == :reading
```

where `user_can_edit?` mirrors the token service's rule
(`allowed_in_project?(:manage_documents, project)`). Viewers stay read-only
with no toggle; editors get Reading-by-default. The new concept is named
`mode` (not `state`) to avoid colliding with the page header's title `state`.
Alternative — a brand-new parallel flag — was rejected because the existing
`readonly` already reaches every affordance the lock must cover.

### Client-side reactive toggle, no reconnect (preferred)

`<BlockNoteView editable=…>` is a reactive prop; BlockNote flips editability on
a live editor without recreating it. Recreating the editor is avoided in this
codebase because it tears down the Yjs `UndoManager` and the Hocuspocus
WebSocket. So the toggle flips editability in place:

1. A Stimulus controller on the page header owns the mode and, on change,
   updates the `read-only` attribute of `<op-block-note>` (plus a read-only
   flag on the attachments panel and title affordances).
2. `BlockNoteElement` observes `read-only` via `attributeChangedCallback`
   (added to `observedAttributes`) and re-renders its React root with the new
   `readOnly` value, so `editable` updates without a new editor.

Alternative — a server round-trip via a `mode` query param re-rendered by the
controller (the `derive_show_edit_state_from_params` mechanism already reads
`params[:state]`) — is simpler but reloads the page and reconnects the editor
on every switch, producing the transient offline banner. Prefer the in-place
toggle; fall back only if the reactive re-render proves infeasible.

### UI: Primer segmented control

Use `Primer::Alpha::SegmentedControl` with two items, **Reading** and
**Editing**, in `Documents::ShowEditView::PageHeaderComponent`. This is the
Primer idiom for the "radio button switch" the intake describes and is already
used elsewhere in the product. New strings go under `documents.page_header.*`.

## Risks / Trade-offs

- **Attribute-observer re-render recreates the editor** → follow the existing
  single-editor-per-mount guidance in `OpBlockNoteEditor.tsx`; re-render the
  React root only, never remount the BlockNote editor or drop the Hocuspocus
  provider.
- **Reading mode mistaken for a security control** → it is a client-side
  convenience only; server-side enforcement for non-editors stays in the OAuth
  token (asserted by the spec's "not an access-control boundary" requirement).
- **Mode/`state` conflation** → the two axes share the header component;
  naming the new axis `mode` and feeding the existing `readonly` keeps them
  distinct.

## Migration Plan

No data migration. The feature is additive and behind the existing
collaborative-document code path (`@document.collaborative? &&
Setting.real_time_text_collaboration_enabled?`). Rollback is removing the
toggle and reverting the effective-`readonly` computation to the
token-derived value; viewers and classic documents are unaffected throughout.

## Open Questions

- **Exact placement/label of the segmented control** within the page header
  (leading vs. trailing, wording of the group label) is a UI-copy detail that
  can be settled during implementation without changing the specs or task
  breakdown.

The intake is a single paragraph specifying only the control (a
Reading/Editing switch, Reading default). Everything else above — who sees the
toggle, which affordances Reading locks, per-load ephemerality, per-user
scope, and leaving classic documents untouched — was decided here because the
intake is silent on them.
