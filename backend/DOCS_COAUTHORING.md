Overview

This project now supports real-time co-authoring for books (chapter-level collaboration) using Yjs and y-websocket.

Key components

- Backend
  - `app/models/collaborative_book.py`: per-book/per-chapter collaboration records and binary snapshot storage.
  - `app/services/collaboration_service.py`: repository helpers to create collaboration entries, manage collaborators, and persist snapshots.
  - `app/routes/collaboration.py`: HTTP endpoints to create/get collabs, save snapshots, invite/remove collaborators, list collaborators, and request a short-lived WS token.
  - `backend/collab_ws/`: a small Node wrapper around `y-websocket` that verifies JWTs with the backend before accepting WS connections.

- Frontend
  - `src/components/Editor/TiptapEditor.tsx`: dynamically enables Yjs collaboration for book chapters when `bookId` and `chapterId` are provided. Uses `yjs`, `y-websocket`, `@tiptap/extension-collaboration`, and `@tiptap/extension-collaboration-cursor`.
  - `src/api/collaboration.ts`: client helpers for collaboration API calls.
  - `src/components/Collaborators/CollaboratorsBar.tsx`: simple UI to show collaborators and invite collaborators.

How it works (flow)

1. Owner opens the book in the editor and activates a chapter for editing.
2. Frontend calls `POST /api/v1/collab/books/{bookId}?chapter_id={chapterId}` to create/get a collaboration entry (if not existed).
3. Frontend requests `GET /api/v1/collab/ws-token?collab_id={collabId}`; the backend verifies the session cookie and returns a short-lived JWT token.
4. Frontend initializes a `Y.Doc`, applies any saved snapshot, and connects to the collaboration WebSocket server (`y-websocket`) using the WS token.
5. Editors collaborate in real time; presence cursors are shown via `CollaborationCursor`.
6. The frontend auto-saves snapshots periodically and on Y.Doc updates by calling `POST /api/v1/collab/{collabId}/snapshot` (server persists snapshot in PostgreSQL).

Security & Permissions

- Only the book owner can initialize a collaboration record for a book/chapter.
- Only collaborators (owner/editor) can edit and save snapshots. The backend enforces these checks.
- WebSocket connections are verified by the `collab_ws` service by calling the backend `GET /api/v1/auth/me` endpoint using the supplied token or cookie.
- Consider adding stronger role management, invitation by email/username, and better UX for onboarding collaborators.

Running locally

1. Install frontend dependencies:

   cd frontend
   npm install

2. Build or run docker-compose (includes `collab_ws` service):

   docker-compose up --build

3. Set env variables for frontend (e.g., in `.env`):

   VITE_API_BASE_URL=http://localhost:8000
   VITE_COLLAB_WS_URL=ws://localhost:1234

Notes & TODOs

- Persisting snapshots only on client save is fine for now, but consider server-side persistence from the collaboration server or a periodic worker to capture canonical updates.
- Improve invite flow to accept usernames/emails instead of raw user IDs.
- Add unit tests for WebSocket auth and Playwright e2e tests for simultaneous editing.
- Add UI to show live cursor positions, selection highlights, and typing indicators more clearly.
