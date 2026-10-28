# WATI Clone backend — WhatsApp Cloud API

This backend connects the React Inbox to Meta's official WhatsApp Cloud API. A phone number by itself is not enough to connect WhatsApp; the number must be onboarded in Meta and you must obtain the API credentials below.

## 1. Requirements
- Node.js 18+ (Node 20+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string
- A Meta app with WhatsApp product enabled and an onboarded/verified business number

## 2. Configure environment variables
From a terminal:

```bash
cd src/server
copy .env.example .env
```

Open `.env` and set `MONGODB_URI`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_APP_SECRET`. Keep `.env` private and never paste access tokens into React code or commit them to Git. `WHATSAPP_BUSINESS_NUMBER=9340799391` is only a display note; the API call needs the **Phone Number ID** from Meta, not the phone number itself.

## 3. Install and run backend
```bash
npm install
npm run dev
```
The backend runs on `http://localhost:5000`. Test `http://localhost:5000/api/health`.

## 4. Configure Meta webhook
Use a public HTTPS URL pointing to `/webhook` (for local development, expose port 5000 with a secure development tunnel). In Meta App Dashboard, configure:
- Callback URL: `https://YOUR_PUBLIC_HOST/webhook`
- Verify token: exactly the value in `WHATSAPP_VERIFY_TOKEN`
- Subscribe to the `messages` webhook field

Also ensure your WhatsApp app is subscribed to your WhatsApp Business Account. Meta's dashboard/API may require this step.

## 5. Run frontend
In another terminal, from the project root:
```bash
npm install
npm run dev
```
The Inbox route is `/inbox`. The UI uses `http://localhost:5000` by default. For a deployed backend, add `VITE_API_BASE_URL=https://your-backend.example.com` to the frontend root `.env` and rebuild.

## API endpoints
- `GET /api/health` — service/database health
- `GET /api/conversations` — latest conversations
- `GET /api/messages/:waId` — chat history for a customer number
- `POST /api/messages` — send a text reply; JSON `{ "to": "91XXXXXXXXXX", "text": "Hello" }`
- `GET /webhook` — Meta webhook verification
- `POST /webhook` — incoming messages and delivery/read status updates

Customer numbers in `to` should be digits with country code, e.g. `91...`, without a plus sign. WhatsApp policy applies: free-form replies are generally available within the 24-hour customer-service window after the user's last message; outside it, use an approved message template. This starter currently sends text replies only.

## Important
- The phone number `9340799391` has not been connected by generating this code. Only the owner of the Meta Business/WhatsApp assets can finish verification and provide the credentials.
- Do not share your access token or app secret in chat. If exposed, rotate them in Meta.
- Before production, add user authentication/authorization, rate limits, logging/monitoring, backup policies, and stricter deployment CORS settings.
