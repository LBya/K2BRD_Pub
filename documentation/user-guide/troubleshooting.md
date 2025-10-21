# Troubleshooting Guide

This guide covers common issues you might encounter while setting up and running the K2BRD application.

## Docker & Setup Issues

### 1. `docker-compose up` fails

**Symptoms:**
- One or both containers fail to start.
- Error messages in the terminal related to build failures or missing files.

**Possible Causes:**
- Docker is not running on your machine.
- Errors in the `Dockerfile` or `docker-compose.yml`.
- A required port (e.g., 5173 or 8000) is already in use by another application.

**Solutions:**
- Ensure the Docker Desktop application is running.
- Check the terminal output for specific error messages. If a port is in use, stop the other application or change the port mapping in `docker-compose.yml`.
- Try running `docker-compose build --no-cache` to force a fresh build of the images.

### 2. Frontend is not connecting to the backend

**Symptoms:**
- The UI loads, but it cannot fetch any data (e.g., Trello boards).
- Network errors in the browser's developer console.

**Possible Causes:**
- The backend container is not running or has crashed.
- The frontend is trying to connect to the wrong backend URL.

**Solutions:**
- Use `docker ps` to verify that both `frontend` and `backend` containers are running.
- Check the logs for the backend container for errors using `docker logs <backend_container_name>`.

## Trello API Issues

### 1. Cannot fetch Trello boards or cards

**Symptoms:**
- The application shows an error message indicating it cannot connect to Trello.
- The backend logs show authentication errors (e.g., 401 Unauthorized).

**Possible Causes:**
- `TRELLO_API_KEY` or `TRELLO_TOKEN` in your `.env` file are incorrect or missing.
- The Trello token has expired or been revoked.

**Solutions:**
- Double-check the Trello credentials in your `api/backend/src/.env` file.
- Generate a new Trello token if necessary.

## LLM Connection Issues

### 1. BRD Generation Fails

**Symptoms:**
- Clicking "Generate BRD" results in an error.
- Backend logs show errors like "Connection refused" when trying to reach the LLM service.

**Possible Causes:**
- The local LLM (e.g., LM Studio) is not running.
- The `LLM_HOST` variable in the `.env` file is misconfigured. The default value `http://host.docker.internal:1234` is for connecting from a Docker container to a service running on the host machine.

**Solutions:**
- Ensure your local LLM server is running and accessible.
- Verify the `LLM_HOST` URL in your `.env` file is correct for your setup.

## Backend & API Issues

### 1. 404 Not Found Error for `/cards` Endpoint

**Symptoms:**
- Console shows 404 error for POST /cards
- System logs show "Network response was not ok"

**Possible Causes:**
- Missing endpoint implementation
- Incorrect route configuration
- Wrong HTTP method

**Solutions:**
1. Verify endpoint exists in FastAPI app
2. Check route decorator matches frontend request
3. Ensure HTTP method is POST

### 2. Data Format Issues

**Symptoms:**
- Server receives request but returns error
- Console shows parsing errors

**Solutions:**
1. Check sessionStorage data format:
```javascript
console.log(JSON.parse(sessionStorage.getItem('selectedCardIds')));
```
2. Verify request body structure:
```javascript
console.log(JSON.stringify({ card_ids: selectedCardIds }));
```

### 3. CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Requests fail with network error

**Solutions:**
1. Add CORS middleware to FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```
*Note: For production, you should restrict `allow_origins` to your specific frontend domain.*

## Debugging Steps

1. Check browser console for request/response details
2. Verify sessionStorage contains valid card IDs
3. Confirm endpoint implementation matches frontend expectations
4. Test endpoint directly using curl or Postman
5. Check server logs for detailed error messages

## Quick Fixes

### Missing Endpoint
```python
@app.post("/cards")
async def get_cards(request: CardRequest):
    return await get_cards_by_ids(request.card_ids)
```

### Invalid Data Format
```javascript
// Ensure proper data structure
const requestBody = {
    card_ids: Array.from(selectedCardIds)
};
```

### Server-Side Logging
```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```
```

This implementation provides:
1. Enhanced logging for debugging
2. Missing endpoint implementation
3. Proper error handling
4. Troubleshooting documentation

Test the changes by:
1. Checking browser console logs
2. Verifying server logs
3. Confirming endpoint response format