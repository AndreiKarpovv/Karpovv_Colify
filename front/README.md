# Karpov Coolify — Office Device Inventory

Office Device Inventory is a modern workspace-level hardware and asset tracking system with built-in subscription limits, fully styled in a sleek dark mode.

## Tech Stack

* **Frontend:** React (Vite) + Tailwind CSS + React Router
* **Database & Auth:** PocketBase (via JS SDK directly from the frontend)
* **Billing & Subscriptions:** Node.js + Express + Stripe (Checkout + Webhooks)
* **Deployment:** Coolify

---

## Implemented Features

* **PocketBase Authentication:** Full Email/Password + OAuth flow.
* **Role-Based Access Control (RBAC):** Distinct views and actions for `admin` and `worker`.
* **Admin Dashboard:** Dedicated access to **Users** management and **Billing** control.
* **Workspace Separation:** Device tracking isolated by workspace environments.
* **Subscription Enforcement:**
    * **Free Workspaces:** Hard-capped at a maximum of **10 devices**.
    * **Paid/Trial Workspaces:** Unlimited device creation.
* **Dual-Layer Safeguards:** Frontend limit alerts combined with server-side PocketBase hooks (`devices-limit.pb.js`) to strictly block illegal creations.
* **Automated Provisioning:** Stripe Webhooks seamlessly handle checkout fulfillment and subscription state changes.

---

## Project Structure

```text
backend/
  .env.example
  package.json
  src/
    server.js
pocketbase/
  SCHEMA_CHANGES.md
  pb_hooks/
    devices-limit.pb.js
src/
  app/
  components/
  contexts/
  hooks/
  lib/
  pages/
  routes/
  utils/
## Environment variables

### Frontend (.env)

VITE_POCKETBASE_URL=[http://127.0.0.1:8090](http://127.0.0.1:8090)
VITE_API_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

### Backend (backend/.env)

```bash
PORT=4000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID=your_stripe_price_id
CLIENT_URL=http://localhost:5173
POCKETBASE_URL=[http://127.0.0.1:8090](http://127.0.0.1:8090)
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=secure_admin_password
```

## PocketBase Schema & Visibility Rules
Apply all foundational database mutations documented in pocketbase/SCHEMA_CHANGES.md.

To fix user visibility (ensuring Admins can see the global directory while Workers are isolated to their own records), configure the following Collection API Rules inside PocketBase:

List Rule: @request.auth.role = "admin" || id = @request.auth.id

View Rule: @request.auth.role = "admin" || id = @request.auth.id

Update Rule: @request.auth.role = "admin" || id = @request.auth.id

Manage Rule (Options): @request.auth.role = "admin"

Stripe Subscription Architecture
Trigger: Admin visits the Billing section and triggers Upgrade to Unlimited.

Session Init: Frontend fires a request to the backend: POST /api/create-subscription-checkout-session.

Redirect: Backend provisions a Stripe Checkout Session in subscription mode; Stripe redirects the client.

Return: Upon standard completion, Stripe returns the admin to the application's Billing dashboard.

Webhook Processing: Stripe registers payment state asynchronously and sends a request to the backend webhook endpoint: POST /api/stripe/webhook.

State Mutation: * active / trialing status mutations change the workspace capacity to an unconstrained limit.

canceled / past_due status mutations fallback and reset the creation cap back to 10.

Server-Side Restrictions
The underlying business rule is enforced via the native PocketBase JavaScript hook (pocketbase/pb_hooks/devices-limit.pb.js). It actively scans record counts before create events; existing hardware logs remain preserved if a downgrade occurs, but new entries will be aggressively rejected if the limit is exceeded.

## Local Development Lifecycle
1. Bootstrapping Dependencies
Install the required packages for both the UI client and the background Node service:

Bash
# Frontend dependencies
npm install

# Backend dependencies
npm --prefix backend install
2. Spinning Up Local Services
Run the backend API and frontend dev servers in separate terminal panes:

Bash
# Terminal 1: API Runtime
npm run backend:dev

# Terminal 2: Vite Dev Environment
npm run dev
3. Local Webhook Routing
Proxy Stripe's cloud events directly to your local node runtime using the Stripe CLI:

Bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
Note: Extract the generated local signing secret from the terminal output and paste it into backend/.env as your STRIPE_WEBHOOK_SECRET.

## Coolify Deployment Configurations
Decoupled Services: Frontend (Static/Vite node) and Backend (Express app) must be provisioned as distinct application resources within Coolify.

Build-Time Envs: Ensure VITE_API_URL correctly mirrors the public secure network domain assigned to your Express application.

Secrets Provisioning: Ensure the production database cluster contains the required collection schemas before traffic routing, and verify that PocketBase admin keys match backend deployment variables perfectly.