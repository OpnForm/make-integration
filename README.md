# OpnForm Make.com Custom App

Configuration files for the [OpnForm](https://opnform.com) custom app on [Make.com](https://www.make.com) (formerly Integromat).

This app provides a **"Watch New Submissions"** instant trigger so Make users can automate workflows whenever a form receives a submission -- the same scope as [Fillout's Make integration](https://www.make.com/en/integrations/fillout).

## How It Works

1. User searches "OpnForm" in Make's module picker
2. Creates a connection using their OpnForm API key (Sanctum token)
3. Selects a workspace and form from dynamic dropdowns
4. Make auto-registers a webhook via OpnForm's standard integration API
5. On each form submission, OpnForm POSTs data to Make's webhook
6. When the scenario is deleted, Make auto-unregisters the webhook

## Architecture

This integration follows the same lightweight pattern as OpnForm's Activepieces integration. It uses OpnForm's **existing `/open/*` API** -- no dedicated Make endpoints are needed.

## Structure

```
├── app.json                        # App metadata
├── connection/
│   ├── parameters.json             # Connection dialog fields (API key)
│   └── communication.json          # Auth validation (GET /open/workspaces)
├── webhook/
│   ├── parameters.json             # Webhook parameters (form selection)
│   ├── attach.json                 # Register webhook (POST /open/forms/{id}/integrations)
│   └── detach.json                 # Unregister webhook (DELETE /open/forms/{id}/integrations/{id})
├── modules/
│   └── watchNewSubmissions/
│       ├── communication.json      # Incoming webhook data processing
│       └── expect.json             # Module parameters (form/workspace selectors)
└── rpcs/
    ├── listWorkspaces.json         # Dynamic dropdown (GET /open/workspaces)
    └── listForms.json              # Dynamic dropdown (GET /open/workspaces/{id}/forms) with pagination
```

## API Endpoints Used

All endpoints are part of OpnForm's existing API, authenticated via Bearer token (Sanctum):

| Endpoint | Method | Purpose |
|---|---|---|
| `/open/workspaces` | GET | Validate API key + list workspaces |
| `/open/workspaces/{id}/forms` | GET | List forms (paginated, 10/page) |
| `/open/forms/{id}/integrations` | POST | Create Make integration (attach webhook) |
| `/open/forms/{id}/integrations/{integrationId}` | DELETE | Remove integration (detach webhook) |

## Setup in Make

Docs: [developers.make.com/custom-apps-documentation](https://developers.make.com/custom-apps-documentation)

### Option A: Make Web Interface

1. Log in to [Make.com](https://www.make.com)
2. In the left sidebar, click **Custom Apps** (click "More" if not visible)
3. Click **+ Create app** and name it `opnform` (label: "OpnForm")
4. Configure the **Connection** using `connection/parameters.json` and `connection/communication.json`
5. Create a **Webhook** (dedicated + attached) using `webhook/` configs
6. Create an **Instant Trigger** module "Watch New Submissions" using `modules/watchNewSubmissions/` configs
7. Create **RPCs** `listWorkspaces` and `listForms` using `rpcs/` configs
8. Test end-to-end with a real OpnForm API key
9. Submit for marketplace review (review takes ~4-6 weeks)

### Option B: VS Code Extension

1. Install the [Make Apps Editor](https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk) VS Code extension
2. Generate a Make API key with `sdk-apps` scopes from your Make account
3. Connect the extension and sync the configs from this repo
4. Edit and test locally, then push changes to Make

## Related

- [OpnForm main repository](https://github.com/OpnForm/OpnForm) -- contains the integration handler
- [OpnForm documentation](https://docs.opnform.com)
