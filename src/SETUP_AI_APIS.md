
# Setup AI APIs for Munal

Munal integrates with powerful AI services to provide transcription and summarization features. Since Munal is a client-side application, you need to provide your own API keys. These keys are stored securely in your browser's local storage and are never sent to our servers.

## 1. OpenAI API (Whisper & GPT)

OpenAI powers the high-accuracy "Whisper" transcription model and GPT-based summarization.

### How to get an API Key:

1.  Go to [OpenAI Platform](https://platform.openai.com/).
2.  Sign up or Log in.
3.  Navigate to **Dashboard** -> **API Keys**.
4.  Click **Create new secret key**.
5.  Name it "Munal App" (optional) and copy the key (starts with `sk-...`).
6.  **Important:** You must add a payment method in "Billing" settings for the API to work, even for trial credits.

### Configuration in Munal:

1.  Go to **Settings** -> **API Configuration**.
2.  Paste your key into the "OpenAI API Key" field.
3.  Click **Save**.

---

## 2. Google Cloud Speech-to-Text

An alternative transcription engine known for fast processing.

### How to get an API Key:

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "Munal Transcription").
3.  Search for **"Cloud Speech-to-Text API"** in the library and **Enable** it.
4.  Go to **Credentials** -> **Create Credentials** -> **API Key**.
5.  Copy the generated key (starts with `AIza...`).

### Configuration in Munal:

1.  Go to **Settings** -> **API Configuration**.
2.  Paste your key into the "Google Cloud API Key" field.
3.  Click **Save**.

---

## Troubleshooting

-   **Error 401 (Unauthorized):** Your API key is incorrect or expired. Check the dashboard of the provider.
-   **Error 429 (Rate Limit):** You have exceeded your quota. Check your billing settings on OpenAI or Google Cloud.
-   **File too large:** The current client-side integration supports files up to 25MB for OpenAI. For larger files, split them or compress them.

## Security Best Practices

-   **Do not use on public computers:** Keys are stored in the browser.
-   **Regenerate keys regularly:** If you suspect a key is compromised, revoke it in the provider's dashboard and generate a new one.
