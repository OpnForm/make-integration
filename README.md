# OpnForm Make.com Custom App

Configuration files for the [OpnForm](https://opnform.com) custom app on [Make.com](https://www.make.com) (formerly Integromat).

This app provides a **"Watch New Submissions"** instant trigger so Make users can automate workflows whenever a form receives a submission -- the same scope as [Fillout's Make integration](https://www.make.com/en/integrations/fillout).

## How It Works

1. User searches "OpnForm" in Make's module picker
2. Creates a connection using their OpnForm API key
3. Selects a workspace and form from dynamic dropdowns
4. Make auto-registers a webhook URL with OpnForm's API
5. On each form submission, OpnForm POSTs data to Make's webhook
6. When the scenario is deleted, Make auto-unregisters the webhook

## Structure

```
├── app.json                        # App metadata
├── icon/
│   └── base.png                    # App icon (512×512)
├── connection/
│   ├── parameters.json             # Connection dialog fields (API key + base URL)
│   └── communication.json          # Auth validation request
├── webhook/
│   ├── parameters.json             # Webhook parameters (form selection)
│   ├── attach.json                 # Register webhook with OpnForm API
│   └── detach.json                 # Unregister webhook from OpnForm API
├── modules/
│   └── watchNewSubmissions/
│       ├── communication.json      # Incoming webhook data processing
│       ├── expect.json             # Module parameters (form/workspace selectors)
│       ├── interface.json          # Output field definitions
│       └── samples.json            # Sample output for field mapping
└── rpcs/
    ├── listWorkspaces.json         # Dynamic dropdown for workspaces
    └── listForms.json              # Dynamic dropdown for forms
```

## API Endpoints (OpnForm Side)

The app calls these endpoints on the OpnForm API (authenticated via Sanctum API token):

| Endpoint | Method | Purpose |
|---|---|---|
| `/external/make/validate` | GET | Validate API key, return user info |
| `/external/make/workspaces` | GET | List user's workspaces |
| `/external/make/forms?workspace_id=X` | GET | List forms in a workspace |
| `/external/make/webhook` | POST | Register webhook (attach) |
| `/external/make/webhook` | DELETE | Unregister webhook (detach) |
| `/external/make/submissions/recent?form_id=X` | GET | Poll sample data for structure detection |

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

- [OpnForm main repository](https://github.com/OpnForm/OpnForm) -- contains the API endpoints and integration handler
- [OpnForm documentation](https://docs.opnform.com)
