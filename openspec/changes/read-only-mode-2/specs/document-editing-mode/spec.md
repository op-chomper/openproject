## Purpose

Gives editors of a collaborative document a per-user Reading/Editing mode that
opens the document as a read-only lock by default and lets them deliberately
switch into an editable state, so shared content is not changed by accident.

## ADDED Requirements

### Requirement: Documents open in Reading mode by default

The collaborative document view SHALL present a two-value mode — **Reading**
and **Editing** — and SHALL start in **Reading** on every page load,
presenting the document as read-only until the user chooses Editing. This
SHALL apply even to users who are allowed to edit the document.

#### Scenario: Editor opens a document

- **WHEN** a user allowed to edit the document (holding `manage_documents`)
  opens a collaborative document
- **THEN** the document body is presented read-only
- **AND** the mode control shows **Reading** selected

#### Scenario: Reading is re-applied on reload

- **WHEN** a user who previously switched to Editing reloads or re-opens the
  document
- **THEN** the document again opens in Reading mode

### Requirement: A Reading/Editing toggle is shown to users who can edit

The document view SHALL render a Reading/Editing switch at the top of the
collaborative document for users who are allowed to edit it. Users who are not
allowed to edit SHALL NOT be offered the toggle and SHALL continue to see the
document as read-only.

#### Scenario: Toggle visible for an editor

- **WHEN** a user with `manage_documents` opens the document
- **THEN** a Reading/Editing toggle is visible at the top of the document

#### Scenario: Toggle hidden for a viewer

- **WHEN** a user with `view_documents` but not `manage_documents` opens the
  document
- **THEN** no Reading/Editing toggle is shown
- **AND** the document is read-only

### Requirement: Selecting Editing unlocks the document

Choosing **Editing** SHALL make the document editable for a user who is
allowed to edit, and choosing **Reading** again SHALL return it to a read-only
presentation. Switching mode SHALL NOT drop the real-time collaboration
session or discard local undo history.

#### Scenario: Switch to Editing

- **GIVEN** an editor is viewing a document in Reading mode
- **WHEN** they select **Editing**
- **THEN** the document body becomes editable
- **AND** the collaboration session remains connected

#### Scenario: Switch back to Reading

- **GIVEN** an editor has switched a document to Editing
- **WHEN** they select **Reading**
- **THEN** the document body becomes read-only again

### Requirement: Reading mode locks all content-modifying affordances

While in Reading mode, the collaborative document view SHALL disable every
content-modifying affordance it presents — the body editor, the attachment
upload/delete actions, and the inline title-edit affordances — so the whole
view reads as locked. Entering Editing mode SHALL restore those affordances
for a user allowed to edit.

#### Scenario: Attachment and title actions locked in Reading mode

- **GIVEN** an editor is viewing a document in Reading mode
- **THEN** the attachment upload/delete actions are unavailable
- **AND** the inline title-edit affordances are unavailable

#### Scenario: Affordances restored in Editing mode

- **WHEN** the editor switches to Editing
- **THEN** the attachment actions and inline title-edit affordances become
  available

### Requirement: The toggle is not an access-control boundary

The Reading/Editing mode SHALL be an editing-safety convenience local to the
current user and SHALL NOT grant, withhold, or broadcast any capability.
Server-side permission enforcement for users without edit permission SHALL
remain unchanged.

#### Scenario: Viewer cannot edit regardless of client state

- **WHEN** a user without `manage_documents` attempts to modify the document
- **THEN** the change is rejected by the existing server-side (collaboration
  token) enforcement, independent of any client-side mode

#### Scenario: Mode is per-user

- **GIVEN** two users are collaborating on the same document
- **WHEN** one is in Reading mode and the other is in Editing mode
- **THEN** each user's mode affects only their own view and does not lock the
  document for the other
