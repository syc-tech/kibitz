Kibitz
=====

Kibitz is a playground for building cross-platform assistants that can understand a chat message, enrich it with contextual data, and send back a final response to any channel. This repository now contains a TypeScript workspace with a backend server that uses [Temporal](https://temporal.io/) workflows to parse template placeholders (e.g. `{{user.name}}`) before a message is posted.

Project layout
--------------

```
.
├── package.json            # Root workspace definition
├── server/                 # Backend service + Temporal worker
│   ├── src/
│   │   ├── activities/     # Temporal activities (parsing + posting)
│   │   ├── lib/            # Pure utility modules
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Temporal client orchestration
│   │   └── workflows/      # Workflow definitions
│   └── tsconfig.json
└── tsconfig.base.json
```

Getting started
---------------

1. Install dependencies
   ```
   npm install
   ```
2. Start (or connect to) a Temporal service. The defaults point to `localhost:7233`, which is what `temporal server start-dev` uses.
3. In one terminal, run the HTTP server:
   ```
   npm run dev
   ```
4. In another terminal, run the Temporal worker that executes the workflows:
   ```
   npm run worker --workspace server
   ```

Environment variables
---------------------

- `PORT`: HTTP port for the Express server (default `4000`).
- `TEMPORAL_TASK_QUEUE`: Task queue that the worker listens to (default `message-processing`).
- `BYPASS_TEMPORAL=true`: Execute the activities inline without Temporal. Useful for local demos if you do not have a Temporal service running.
- `OTP_DIRECTORY`: Optional JSON array of `{ "username": string, "otp": string, "userId"?: string }` objects that define who can link a chat. Defaults to two demo users.
- `DATA_DIR`: Directory where consent + user JSON files are stored (default `server/data`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`: Postgres connection options. When running against the deployed Cloud SQL instance, set `DB_HOST=/cloudsql/<instance-connection-name>` (the connection between Cloud Run and Cloud SQL is already encrypted). Set `DB_SSL=true` only when connecting over TCP.
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_MESSAGING_SERVICE_SID`: Enables inbound/outbound MMS handling via `POST /api/twilio/mms`.
- `TWILIO_DEFAULT_FROM`: Optional fallback phone number to set as the sender when replying through Twilio.

Chat authorization
------------------

Every incoming message must come from a chat/author pair that has either:

1. Linked itself to a known account by sending `connect <username> <otp>` (or `link ...`) where the OTP is verified against `OTP_DIRECTORY`.
2. Granted ephemeral permission by sending `yes`. In this mode, no user profile is stored; only the chat/author pair is recorded (and can be revoked at any time).

If a message arrives before either of those paths runs, the service returns a `403` JSON error explaining how to proceed. The linking/consent commands themselves do not trigger template parsing; they simply return `200` with a confirmation message.

Revoking, linking & persistence
-------------------------------

- Consent decisions, chats, and messages now live inside the Postgres database (Cloud SQL when deployed). For local development, point the `DB_*` environment variables at any Postgres instance.
- Anyone can send `revoke` (or `unlink`) in-channel to remove the consent entry immediately.
- When two chats collect the exact same set of authorized users (for example, Slack + MMS with the same group), Kibitz proposes to merge them. Participants can respond with `share yes` to join the shared timeline. Once each member in both chats accepts, the chats share a single `sharedGroupId` so their messages and reminders stay in sync.
- Resetting data in dev is as simple as truncating the tables.

User management REST helpers
----------------------------

The backend exposes a few helper endpoints so the web UI (and future admin tooling) can manage OTPs and integrations:

- `POST /api/users/register` — `{ "username": "...", "email": "..." }` → `{ id, username, email, otp, services }`
- `GET /api/users/:username` — returns the stored profile (minus OTP)
- `POST /api/users/:username/oauth` — `{ "serviceName": "slack" }` → appends a mock OAuth connection record

These endpoints only stub out the flows; a production system would integrate with a true identity store and OAuth provider per service.

Message parsing workflow
------------------------

1. `POST /api/messages` or the Twilio webhook (`POST /api/twilio/mms`) receives a payload that represents a message anybody posted in chat plus any values that should be substituted. Only linked/consented chats reach this step; otherwise the API responds with instructions to link the chat.
   ```json
   {
     "message": "Hello {{user.name}}, your ticket {{ticket.id}} is due on {{ticket.due}}.",
     "values": {
       "user": { "name": "Aimee" },
       "ticket": { "id": 912, "due": "2024-06-30" }
     },
     "channel": "slack:general",
     "messageId": "msg-001",
     "author": "dora"
   }
   ```
2. The HTTP handler logs a `message.received` event (representing the original post) and hands the data to the Temporal workflow `processMessageWorkflow`. Metadata includes whether the chat is a permanently linked account or a temporary consent.
3. Activities parse the message, swap every `{{reference}}` with the supplied value (supports dot-notation keys), track any missing references, and remember all placeholders.
4. The `postMessageActivity` acts like the bot posting a follow-up reply that references the original message ID so that people across MMS/SMS/Slack/etc. can see the fully populated message. When the channel starts with `twilio:*`, the service uses the Twilio REST API to send an MMS/SMS with the rendered output.
   ```json
   {
     "id": "message-...-abcd1234",
     "postedAt": "2024-05-21T22:12:54.018Z",
     "channel": "slack:general",
     "replyTo": "msg-001",
     "author": "dora",
     "originalMessage": "Hello {{user.name}}, your ticket {{ticket.id}} is due on {{ticket.due}}.",
     "rendered": "Hello Aimee, your ticket 912 is due on 2024-06-30.",
     "missingKeys": [],
     "placeholders": ["user.name", "ticket.id", "ticket.due"],
     "substitutions": {
       "user.name": "Aimee",
       "ticket.id": "912",
       "ticket.due": "2024-06-30"
     }
   }
   ```

Chat & message APIs
-------------------

- `GET /api/chats` — returns every known chat (channel ID, participants, shared group ID, pending link offers, etc.).
- `GET /api/chats/:sharedGroupId/messages` — returns the merged timeline for the chat group (only includes messages from members who have approved parsing).
- `GET /api/events` — Server-Sent Events (SSE) stream that emits `chat-updated` and `message-created` events so dashboards can stay real-time without polling.

All chat/message data is stored inside Postgres (Cloud SQL in production).

Web frontend
------------

The `web/` workspace hosts a React dashboard where you can:

1. Register to receive OTP codes.
2. Simulate OAuth connections to integrated services.
3. See every chat, whether it is linked, and view the merged timelines for approved members.
4. Watch chats/messages update live through the SSE feed (no manual refreshes required).

```
npm run dev:web     # http://localhost:5173 with a proxy to the backend /api
npm run build:web   # type-check + emit a production bundle
```

When both the backend (`npm run dev`) and frontend dev servers are running, the proxy ensures API calls succeed without CORS tweaks. Twilio MMS messages can be pointed at `http://<server>/api/twilio/mms` with the standard webhook payloads; the handler will respond with TwiML acknowledging the message and triggering the Temporal workflow.

Cloud deployment
----------------

Infrastructure-as-code lives under `infra/` and the automated deploy script sits in `scripts/deploy.sh`. The workflow is:

1. Ensure you have the GCP CLI (`gcloud`), Terraform ≥ 1.5, and Docker installed locally.
2. Create a `.env` file (the `.env.example` template is provided) and fill in your project-specific values. At minimum:
   ```
   cp .env.example .env
   # edit .env
   PROJECT_ID=kibitz-478907
   REGION=us-central1
   CLOUD_RUN_REGION=us-central1
   DB_REGION=us-central1
   ARTIFACT_REPOSITORY=kibitz
   TF_STATE_BUCKET=kibitz-478907-terraform
   ```
   The deploy script automatically sources `.env`, so the values are available to Terraform and the Cloud Build step.
3. Authenticate with Google Cloud (`gcloud auth application-default login`) and make sure your account has permission to manage Cloud Run, Cloud SQL, and Artifact Registry.
4. Run `make deploy`.

`make deploy` performs the following steps:

- Builds and pushes the server/worker/frontend container images through Cloud Build (`infra/cloudbuild.yaml`) into Artifact Registry.
- Creates (if needed) a GCS bucket for Terraform state and stores state remotely.
- Applies `infra/terraform` to provision (or update) the Cloud SQL Postgres instance, Artifact Registry repo, runtime service account, and all three Cloud Run services:
  - `kibitz-api`: Express + Temporal client + SSE endpoint.
  - `kibitz-worker`: Temporal worker process.
  - `kibitz-web`: Static frontend served via nginx.
- Injects database environment variables and attaches the Cloud SQL connection to the API + worker services.

Terraform outputs expose the Cloud SQL connection name, database credentials, and Artifact Registry URL so the script can wire everything together.

Service account credentials
---------------------------

Store the Google service account JSON key locally (e.g., `gcp-service-account.json`). The file is ignored by Git so secrets never land in source control. You can then activate it locally via:

```
gcloud auth activate-service-account --key-file gcp-service-account.json
```

GitHub Actions workflow
-----------------------

`.github/workflows/deploy.yml` runs `make deploy` on every merge to `main` (and may also be triggered manually). To enable it:

- Create a service account with the following roles: `Cloud Run Admin`, `Cloud SQL Admin`, `Artifact Registry Administrator`, `Cloud Build Editor`, and `Service Account User`.
- Generate a JSON key for that account and store it in the repo’s secrets as `GCP_SA_KEY`.
- Add `GCP_PROJECT_ID`, `GCP_REGION`, and `TF_STATE_BUCKET` secrets (and optionally define `ARTIFACT_REPOSITORY` in repository variables).

Once configured, merging to `main` will build/push the containers, run Terraform, and deploy the Cloud Run services in the configured project/region.

Next steps
----------

- Flesh out authentication, messaging platform integrations, and scheduling workflows.
- Replace the mock `postMessageActivity` with real transport adapters (Slack, Discord, etc.).
- Extend the parser to support conditional blocks or filters.
- Back the repositories with a durable database and add audit logs for consent changes.
- Swap the fake OAuth endpoint with provider-specific flows (Slack, Discord, SMS gateways, etc.).
