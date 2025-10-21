# K2BRD

Automated Project Management tool that integrates with Trello to generate Business Requirements Documents (BRDs) using a local LLM. This project uses a Python backend with FastAPI and a plain JavaScript frontend.

## Features

- Fetch and parse Trello cards with structured data.
- Generate BRDs using a local LLM (e.g., LM Studio).
- Modern frontend with a tabbed interface to manage and view generated BRDs.
- Dockerized for easy setup and deployment.

## Project Structure

- `api/backend`: Contains the FastAPI backend application.
- `api/frontend`: Contains the vanilla JavaScript frontend application.
- `docker-compose.yml`: Defines the services, networks, and volumes for the Docker application.
- `documentation`: Contains project documentation.

## Setup and Running the Project

This project is fully containerized using Docker.

### Prerequisites

- Docker and Docker Compose installed.
- A `.env` file with the necessary credentials.

### Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd K2BRD
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file inside the `api/backend/src` directory. You can use the following template:

    ```env
    # Trello Config
    TRELLO_API_KEY=""
    TRELLO_TOKEN=""
    TRELLO_BASE_URL="https://api.trello.com/1"

    # GitHub Config
    GITHUB_TOKEN="" # Note: As of the last audit, GitHub integration is configured but not fully used.

    # LLM Config (example for LM Studio)
    LLM_HOST="http://host.docker.internal:1234" # Use host.docker.internal to connect to a service on your host machine from the container
    LLM_MODEL="local-model" # The model to be used by your local LLM
    MAX_TOKENS=2500

    # CORS
    CLIENT_ORIGIN="http://localhost:5173"
    ```
    Fill in your Trello API key and token.

3.  **Build and Run with Docker Compose:**
    From the root directory of the project, run:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the frontend and backend services and start the containers.

4.  **Access the application:**
    - The frontend will be available at `http://localhost:5173`.
    - The backend API documentation (Swagger UI) will be at `http://localhost:8000/docs`.

## Trello Card Format

For the application to correctly parse Trello cards, the card description should follow this format:

```markdown
### Essential info

- **Project:** [projectName]
- **Due Date:** [cardDueDate]
- **Effort:** [cardEffort]
- **Relevant repo:** [gitHubLink]
- **Impacted assets:** [listOfRelevantAssetsInRepo]
- **Relevant stakeholders:** [trelloMembers]

#### Description:
[Description of task]
```

## Labels

Use the following label format in Trello for automated categorization:
- Type: [type]
- Priority: [priority] 