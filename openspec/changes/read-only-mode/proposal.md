# Read-only mode for Documents

## Problem

Collaborative documents (the BlockNote/Hocuspocus editor reachable from a
project's *Documents* module) open directly in an editable state for anyone
who holds the `manage_documents` permission. The moment such a user opens a
document, the caret is live and any keystroke, paste, or accidental drag
edits shared content in real time for every other connected collaborator.

There is today no way for a user who *can* edit to deliberately open a
document just to read it. The only read-only experience is a side effect of
*lacking* edit permission: `Documents::OAuth::TokenWithMetadataService`
marks the collaboration token `readonly` only when a user has
`view_documents` but not `manage_documents`
(`modules/documents/app/services/documents/oauth/token_with_metadata_service.rb:91`).
Editors get no equivalent protection against unintended edits.

The intake (Document #317, "Read-only mode for Documents") asks for exactly
this: a read-only lock users can turn on and off, presented as a switch at
the top of the document with the values **Reading** and **Editing**, where
**Reading is the default** and the user must actively choose **Editing**
before the document becomes editable.

## What this delivers

- A **Reading / Editing** toggle at the top of the collaborative document
  view, rendered for users who are allowed to edit the document.
- **Reading is the default** on every page load: the document opens
  presented as read-only even for editors.
- Choosing **Editing** unlocks the document body (and its attachment
  actions) so the user can make changes; choosing **Reading** again re-locks
  it.
- Users who lack edit permission continue to see the document exactly as
  they do today — always read-only, with no toggle to change that.

## Scope

- **In scope:** the collaborative (BlockNote) document show/edit view served
  by `DocumentsController#show` when real-time text collaboration is enabled.
- **Out of scope:** "classic" (non-collaborative) documents, which use a
  separate `edit`/`update` flow; the read-only enforcement for users without
  edit permission (already handled by the OAuth token); and persisting a
  user's chosen mode across page loads (see `design.md`).

## Non-goals

- This toggle is an **editing-safety convenience, not an access-control
  boundary.** Real permission enforcement stays server-side in the
  collaboration token. A user who can already edit may switch to Editing at
  any time; Reading mode does not withhold any capability they otherwise
  have.
