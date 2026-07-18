# Debug Notes

## Current known issues and resolutions

### 1) Missing environment variables on backend start

Symptom:
- backend crashes on startup with env validation errors

Cause:
- `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` missing in `backend\.env`

Fix:
- create `backend\.env` with all required values

### 2) Duplicate Mongoose email index warning

Symptom:
- warning about duplicate schema index on `email`

Cause:
- index declared twice in the user schema

Fix:
- keep a single unique index definition

### 3) GET routes returning 400 unexpectedly

Symptom:
- analytics and conversations GET routes returned validation errors

Cause:
- validation payload normalization needed explicit empty objects for GET body/params/query

Fix:
- normalize request payload before schema parsing

### 4) GET routes returning 500 with `req.query` error

Symptom:
- dashboard showed `Cannot set property query of #<IncomingMessage> which has only a getter`

Cause:
- validation middleware tried to reassign `req.query`

Fix:
- mutate `req.query` in place instead of replacing the object reference

### 5) Gemini invalid API key

Symptom:
- Gemini returns 400 invalid key

Cause:
- wrong or inactive API key

Fix:
- create a valid key in Google AI Studio and update `backend\.env`

### 6) Gemini model not found

Symptom:
- Gemini returns 404 for a model name

Cause:
- chosen model is deprecated or not available for the project

Fix:
- switch to a currently supported alias such as `gemini-flash-latest`

### 7) Gemini quota exceeded

Symptom:
- Gemini returns 429 quota exceeded

Cause:
- free tier or project quota is exhausted

Fix:
- wait for reset, enable billing, or use another project with available quota

## Safe debugging checklist

1. confirm backend `.env` values
2. confirm backend is running on port `5000`
3. confirm frontend is running on port `3000`
4. call `/api/health`
5. verify login works
6. verify upload works
7. verify document listing works
8. verify analytics works
9. verify Gemini key, model, and quota status

## Manual smoke-test order

1. register user
2. login user
3. upload a small TXT file
4. open dashboard
5. ask a question in chat
6. check history page
7. check search page


