# Workflow Automation & Monitoring SaaS Platform

A full-stack web application for creating, managing, and monitoring automated workflows. Users can configure workflows, monitor execution history, inspect execution logs, and retry failed executions. Administrators have access to an admin dashboard.

## 1. Project Overview

The Workflow Automation & Monitoring SaaS Platform simplifies repetitive tasks by allowing users to configure and monitor automated workflows.

### Key Features

- User registration and login
- JWT-based authentication
- Role-based access control (`USER` and `ADMIN`)
- Workflow creation, listing, editing, and deletion
- Enable and disable workflows
- Workflow search and pagination
- Workflow execution history
- Execution status monitoring
- Failed execution retry
- Execution input data and step-log viewing
- Dashboard KPI cards
- Recharts-based dashboard visualizations
- Responsive React interface
- Form validation and toast notifications
- REST API documentation through Swagger UI
- Automated backend testing with Pytest

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Routing | React Router DOM |
| API Integration | Axios |
| Forms | React Hook Form |
| UI Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Toastify |
| Backend | Python, FastAPI |
| Database | MySQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Password Security | Password Hashing |
| Testing | Pytest |
| API Documentation | Swagger UI / OpenAPI |
| Scheduling | APScheduler |

## 3. Application Architecture

```text
                 USER / ADMIN
                      |
                      v
             React + Vite Frontend
                      |
               Axios REST Requests
                      |
                      v
               FastAPI Backend
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Auth API   Workflow API  Execution API
          |           |           |
          +-----------+-----------+
                      |
                      v
                Service Layer
          +-----------+-----------+
          |           |           |
          v           v           v
     Workflow     Condition    Action
      Engine       Engine      Services
                      |
                      v
              SQLAlchemy ORM
                      |
                      v
                  MySQL DB

          APScheduler
               |
               v
       Scheduled Workflows
```

## 4. Project Structure

```text
workflow-automation-platform/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── security.py
│   │   └── main.py
│   │
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── user/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

**Note:** Adjust the folder names in this structure to match the actual project. For example, use `routers/` instead of `routes/` if that is the folder name in your backend.

## 5. Database Design

The application uses MySQL and SQLAlchemy models.

### Main Tables

| Table | Purpose |
|---|---|
| `users` | Stores user details and roles |
| `workflows` | Stores workflow definitions and ownership |
| `workflow_triggers` | Stores workflow trigger configuration |
| `workflow_conditions` | Stores workflow conditions |
| `workflow_actions` | Stores actions configured for workflows |
| `workflow_executions` | Stores workflow execution history and status |
| `execution_step_logs` | Stores individual execution step logs |

### Entity Relationships

```text
users
  |
  | 1:N
  v
workflows
  |
  +-------- 1:N --------> workflow_triggers
  |
  +-------- 1:N --------> workflow_conditions
  |
  +-------- 1:N --------> workflow_actions
  |
  +-------- 1:N --------> workflow_executions
                              |
                              | 1:N
                              v
                       execution_step_logs
```

- A user can own multiple workflows.
- A workflow can have trigger, condition, and action configurations.
- A workflow can have multiple execution records.
- Each execution can contain multiple step logs.

The exact foreign-key constraints and cascade behavior depend on the implemented SQLAlchemy models.

## 6. Authentication and Authorization

The application supports two roles:

- **USER:** Manages their own workflows and views their execution history.
- **ADMIN:** Accesses the admin dashboard and any additional administrative functionality implemented in the backend.

Authentication uses a JWT access token.

After successful login, the frontend stores the access token and attaches it to API requests:

```http
Authorization: Bearer <access_token>
```

The backend must verify the token and enforce authorization for protected endpoints. Frontend route protection alone is not sufficient.

## 7. API Documentation

Start the backend and open:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`

### Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Retrieve the authenticated user's details |

### Workflow APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/workflows/` | Create a workflow |
| GET | `/workflows/` | List workflows with pagination and search |
| GET | `/workflows/{id}` | Retrieve workflow details |
| PUT | `/workflows/{id}` | Update a workflow |
| DELETE | `/workflows/{id}` | Delete a workflow |
| PATCH | `/workflows/{id}/status` | Enable or disable a workflow |

Example workflow listing request:

```http
GET /workflows/?page=1&limit=10&search=email
```

### Execution APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/executions/` | Retrieve execution history |
| GET | `/executions/{execution_id}` | Retrieve execution details and step logs |
| POST | `/executions/{execution_id}/retry` | Retry a failed execution |

Example execution filtering:

```http
GET /executions/?page=1&limit=10&status=FAILED
```

Filter by workflow:

```http
GET /executions/?page=1&limit=10&workflow_id=1
```

### Webhook API

```http
POST /webhooks/{workflow_id}
```

The webhook expects the configured secret header:

```http
x-webhook-secret: <configured-secret>
```

Example request body:

```json
{
  "input_data": {
    "source": "website",
    "event": "form_submitted"
  }
}
```

Only use this example after confirming that the workflow and webhook trigger are configured correctly.

## 8. Prerequisites

Install the following before running the application:

- Python 3.11 or another version supported by the project's dependencies
- Node.js and npm
- MySQL Server
- Git

Verify the installations:

```bash
python --version
node --version
npm --version
git --version
```

## 9. Backend Setup

### Step 1: Navigate to the backend

```bash
cd backend
```

### Step 2: Create a virtual environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

macOS / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure environment variables

Copy `.env.example` to `.env` and update the values.

Windows:

```bash
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Example configuration:

```env
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/workflow_db
SECRET_KEY=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use the exact variable names expected by your `config.py`. Add other required variables if your implementation needs them.

### Step 5: Create the database

Open MySQL and execute:

```sql
CREATE DATABASE workflow_db;
```

Make sure the database username and password match your `.env` configuration.

### Step 6: Start the backend

From the `backend/` directory:

```bash
uvicorn app.main:app --reload
```

The backend should be accessible at:

```text
http://127.0.0.1:8000
```

If your application uses Alembic migrations, apply them before starting the application:

```bash
alembic upgrade head
```

Run this command only after confirming that Alembic is configured and migration files exist.

## 10. Frontend Setup

Open another terminal.

### Step 1: Navigate to the frontend

```bash
cd frontend
```

### Step 2: Install dependencies

```bash
npm install
```

Required packages include:

```bash
npm install react-router-dom axios react-hook-form
npm install react-toastify recharts lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

### Step 3: Configure the API URL

The Axios client currently uses:

```javascript
baseURL: "http://127.0.0.1:8000"
```

Ensure the backend is running at this address. If the backend uses a different address or port, update `src/api/axios.js`.

### Step 4: Start the frontend

```bash
npm run dev
```

Vite normally serves the frontend at:

```text
http://localhost:5173
```

Open that URL in your browser.

## 11. Workflow Execution Lifecycle

A typical workflow execution can follow this sequence:

1. A trigger initiates the workflow.
2. The workflow engine creates an execution record.
3. The execution status changes to `RUNNING`.
4. Configured conditions are evaluated.
5. Actions execute if their conditions are satisfied.
6. Step logs record the results.
7. The final execution status becomes `SUCCESS` or `FAILED`.
8. Users can inspect execution details.
9. Failed executions can be retried if the workflow remains enabled.

The actual behavior depends on the implemented trigger, condition, and action services.

## 12. Testing

The backend uses Pytest.

From the `backend/` directory, run:

```bash
pytest
```

For detailed output:

```bash
pytest -v
```

For coverage, if `pytest-cov` is installed:

```bash
pytest --cov=app --cov-report=term-missing
```

Recommended test areas:

- User registration
- Successful login
- Invalid login
- Authentication and unauthorized API access
- Workflow creation
- Workflow pagination and search
- Workflow ownership and access restrictions
- Workflow enable/disable
- Execution history filtering
- Execution detail retrieval
- Retry validation
- Duplicate scheduled execution prevention
- Webhook secret validation
- Condition and action execution behavior

Report the actual test count and pass/fail results after running the test suite; do not assume all tests pass before verification.

## 13. Environment Variables and Security

- Never commit `.env` to GitHub.
- Commit `.env.example` with placeholder values only.
- Use a strong, random secret key.
- Store passwords as secure hashes, never as plaintext.
- Validate user input on the backend.
- Enforce ownership checks for workflows and executions.
- Keep webhook secrets confidential.
- Use HTTPS in production.
- Configure CORS for the intended frontend origin.
- Do not expose sensitive exception details to API clients.

## 14. Known Implementation Considerations

Before treating the application as production-ready, verify the following:

- Trigger, condition, and action configurations are persisted by backend APIs.
- The workflow builder saves those configurations rather than only keeping them in frontend state.
- Scheduled jobs are started and stopped correctly.
- Database migrations reflect the current SQLAlchemy models.
- Deleting a workflow handles related records safely.
- The admin dashboard uses genuinely authorized admin analytics if system-wide statistics are required.
- Pagination provides consistent navigation for filtered execution history.
- Retry requests create a new execution and preserve the original execution history.
- API responses match the frontend's expected schema fields.
- Error handling, CORS, logging, and security settings are configured appropriately.

## 15. Future Enhancements

- Workflow templates
- More trigger types
- Additional condition operators
- More action integrations
- Real-time execution updates
- Execution duration metrics
- Workflow analytics and reports
- Admin-wide usage monitoring
- Email alerts for failed executions
- Docker deployment
- CI/CD automation

## 16. License

Add the license selected for this project before distributing it publicly.

---

**Project:** Workflow Automation & Monitoring SaaS Platform

**Frontend:** React + Vite

**Backend:** FastAPI

**Database:** MySQL

**Testing:** Pytest
