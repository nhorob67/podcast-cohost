# Elias - AI Podcast Co-Host with Memory System

Complete setup guide for the enhanced Elias system with conversation management, report integration, and personality configuration.

## New Features

- **Persistent Conversation Memory**: All conversations are saved to Supabase and can be referenced in future sessions
- **Selective Conversation Management**: Archive or delete conversations as needed
- **Report Upload System**: Upload Markdown, PDF, TXT, and DOCX files that become part of Elias's knowledge base
- **Conversation Import**: Import historical chat data from external sources
- **Configurable Personality**: Load and manage personality configurations
- **Intelligent Context Referencing**: Elias naturally references past conversations with adjustable frequency
- **Management Dashboard**: Web interface to manage all aspects of the system

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- OpenAI API key
- Supabase database (already configured in your `.env`)

## Installation Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Your `.env` file should already contain:
```
OPENAI_API_KEY=your-openai-api-key-here
ASSISTANT_ID=your-assistant-id-here
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Initialize Database

The database schema was automatically created. Verify it's working:

```bash
python -c "from db_client import supabase; print('Database connected!')"
```

### 5. Initialize Default Personality

```bash
python init_personality.py
```

This loads the default Elias personality from `personality/default_elias.json`.

### 6. Setup OpenAI Assistant (if not already done)

```bash
python setup_assistant.py
```

Copy the `ASSISTANT_ID` to your `.env` file.

## Running the System

### Start the Backend Server

```bash
python main.py
```

The server runs on `http://localhost:8000`

### Start the Frontend Development Server

In a separate terminal:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`

## Using the System

### Management Dashboard

Visit `http://localhost:5173` to access the management dashboard with three tabs:

#### 1. Conversations Tab
- View all past conversations
- Click a conversation to see full transcript
- Archive conversations to hide them
- Delete conversations permanently
- Conversations are automatically created when you start a voice session

#### 2. Reports Tab
- Upload reports in multiple formats (MD, PDF, TXT, DOCX)
- Add title, description, and tags for organization
- Uploaded reports are automatically:
  - Processed and text extracted
  - Added to OpenAI's vector store
  - Made available to Elias during conversations

#### 3. Settings Tab
- **Reference Frequency**: Control how often Elias mentions past conversations
  - Never: 0% chance
  - Rarely: 20% chance
  - Sometimes: 50% chance
  - Often: 80% chance
  - Always: 100% chance
- **Weight Factor**: Fine-tune the probability (0.0 to 1.0)
- **Max Context Conversations**: Limit how many past conversations are included (0-10)

### Voice Conversations

Open `http://localhost:8000` for the voice interface:

1. Click "Start" to begin recording
2. Speak your message
3. Click "Stop" when done
4. Elias responds with voice, optionally referencing past conversations
5. All exchanges are automatically saved to the database

### Importing Past Conversations

Use the API endpoint:

```bash
curl -X POST http://localhost:8000/api/conversations/import \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Past Discussion on Q3 Strategy",
    "started_at": "2025-10-15T10:30:00Z",
    "messages": [
      {"role": "user", "content": "What are our Q3 goals?"},
      {"role": "assistant", "content": "Your Q3 goals focus on..."}
    ]
  }'
```

## API Reference

### Conversations

- `GET /api/conversations` - List recent conversations
- `GET /api/conversations/{id}` - Get conversation details
- `POST /api/conversations/import` - Import external conversation
- `PUT /api/conversations/{id}/title` - Update conversation title
- `POST /api/conversations/{id}/archive` - Archive conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### Reports

- `GET /api/reports` - List all reports
- `GET /api/reports/{id}` - Get report details
- `POST /api/reports/upload` - Upload new report
- `DELETE /api/reports/{id}` - Delete report

### Settings

- `GET /api/settings` - Get all settings
- `PUT /api/settings/reference-frequency` - Update reference frequency
- `PUT /api/settings/max-context` - Update max context conversations

### Personality

- `GET /api/personality` - Get active personality
- `POST /api/personality` - Create new personality
- `PUT /api/personality/{id}/activate` - Activate personality

## File Structure

```
project/
├── services/                    # Backend services
│   ├── conversation_service.py  # Conversation CRUD operations
│   ├── report_service.py        # Report management
│   ├── personality_service.py   # Personality configuration
│   └── reference_service.py     # Reference settings
├── utils/                       # Utility modules
│   ├── file_processor.py        # File parsing (PDF, DOCX, MD, TXT)
│   └── context_builder.py       # Context generation for AI
├── src/components/              # React components
│   ├── ManagementDashboard.tsx  # Main dashboard
│   ├── ConversationList.tsx     # Conversation browser
│   ├── ReportUpload.tsx         # Report upload form
│   └── SettingsPanel.tsx        # Settings interface
├── personality/                 # Personality configurations
│   └── default_elias.json       # Default Elias personality
├── main.py                      # FastAPI server
├── api_routes.py                # REST API endpoints
├── db_client.py                 # Supabase client
├── setup_assistant.py           # OpenAI Assistant setup
└── init_personality.py          # Personality initialization
```

## Customization

### Modifying Elias's Personality

Edit `personality/default_elias.json` and re-run:

```bash
python init_personality.py
```

### Changing Reference Behavior

Use the Settings panel in the dashboard or API:

```bash
curl -X PUT http://localhost:8000/api/settings/reference-frequency \
  -H "Content-Type: application/json" \
  -d '{"level": "often", "weight": 0.8}'
```

### Adding New Report Types

Extend `utils/file_processor.py` with new file type handlers.

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check network connectivity
- Ensure database tables were created (run migrations again if needed)

### Reports Not Uploading
- Check supported file types: MD, PDF, TXT, DOCX
- Ensure `uploads/` directory is writable
- Verify file size isn't excessive

### Context Not Including Past Conversations
- Check reference frequency settings (may be set to "never")
- Verify conversations exist and aren't archived
- Ensure max context > 0

### Assistant Not Responding
- Verify `ASSISTANT_ID` in `.env`
- Check OpenAI API key is valid
- Ensure Assistant has file_search enabled

## Best Practices

1. **Regular Cleanup**: Archive or delete old conversations you don't want referenced
2. **Organize Reports**: Use consistent tagging for easy retrieval
3. **Tune Reference Frequency**: Start with "sometimes" and adjust based on experience
4. **Monitor Context Size**: Too many context conversations can slow responses
5. **Backup Data**: Regularly export conversation data from Supabase

## Future Enhancements

- Voice activity detection (auto-stop recording)
- Conversation search and filtering
- Report version management
- Multiple personality profiles
- Conversation analytics dashboard
- Export conversations to various formats

## Support

For issues or questions, check the logs:
- Backend: Terminal running `main.py`
- Frontend: Browser console
- Database: Supabase dashboard

Enjoy your enhanced conversations with Elias!
