# Elias AI Co-Host - Startup Guide

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** and npm installed
3. **OpenAI API Key** from [platform.openai.com](https://platform.openai.com/api-keys)
4. **Supabase Database** configured (connection details in `.env`)

## First-Time Setup

### 1. Install Dependencies

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Install Node.js dependencies (if not already done)
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials:
# - OPENAI_API_KEY=sk-your-key-here
# - VITE_SUPABASE_URL=your-supabase-url
# - VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Build the Frontend

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### 4. Start the Application

```bash
python3 main.py
```

The system will automatically:
- Check for required configuration
- Initialize personality from `personality/default_elias.json`
- Create the OpenAI Assistant with files from `knowledge/` folder (if any)
- Save the Assistant ID to your `.env` file

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

You'll see a unified web application with:
- **Dashboard** (default page): Manage conversations, reports, personality settings
- **Voice Chat** page: Have real-time voice conversations with Elias

## Development Mode

For active development with hot module reloading:

### Terminal 1: Backend Server
```bash
python3 main.py
```

### Terminal 2: Frontend Dev Server
```bash
npm run dev
```

Then visit `http://localhost:5173` to access the dev server.

## Application Structure

### Two Main Pages

1. **Dashboard** (`/`)
   - View and manage conversation history
   - Upload reports (PDF, Markdown, TXT, DOCX)
   - Edit AI personality and system prompts
   - Adjust reference frequency and context settings

2. **Voice Chat** (`/chat`)
   - Click "Start" to begin recording
   - Speak naturally to Elias
   - Click "Stop" when finished
   - Listen to Elias's voice response
   - See conversation transcript in real-time

### Backend Features

- **WebSocket Connection**: Low-latency voice streaming
- **Supabase Integration**: Persistent conversation storage
- **OpenAI Assistants API**: Advanced AI reasoning with file search
- **Automatic Initialization**: No manual setup required

## Troubleshooting

### "OPENAI_API_KEY not found"
- Ensure your `.env` file exists and contains `OPENAI_API_KEY=sk-...`
- The API key must be valid and have sufficient credits

### "Assistant not configured"
- The system should auto-create the assistant on first run
- Check console output for any errors during initialization
- Verify `ASSISTANT_ID` is set in `.env` after first run

### Microphone not working
- Grant browser permissions for microphone access
- Try a different browser (Chrome/Edge recommended)
- Ensure microphone is not blocked by system settings

### Database connection errors
- Verify Supabase credentials in `.env`
- Check that Supabase database migrations have been applied
- Ensure your Supabase project is active

### WebSocket connection issues
- Ensure backend is running on port 8000
- Check firewall settings
- Try refreshing the browser page

## Updating Personality

1. Navigate to Dashboard → Personality tab
2. Edit the system instructions, speaking style, or knowledge domains
3. Click "Save Personality"
4. Changes take effect immediately in new conversations

## Adding Knowledge Files

Place PDF, Markdown, TXT, or DOCX files in the `knowledge/` folder before first run, or upload them through the Dashboard → Reports tab.

## Production Deployment

For production deployment:

1. Build the frontend: `npm run build`
2. Set production environment variables
3. Run with a process manager like `systemd` or `pm2`
4. Use a reverse proxy (nginx/Caddy) for HTTPS
5. Configure proper database security and backups

## Support

For issues or questions, check:
- Console output for error messages
- Browser developer console for frontend errors
- OpenAI API usage dashboard for API issues
- Supabase dashboard for database issues
