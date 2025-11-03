# Quick Start Guide - Web-Based Setup

You can now set up the entire system through a web interface! No command line required.

## Setup Steps

### 1. Install Dependencies

**Python:**
```bash
pip3 install -r requirements.txt
```

**Node.js (already done):**
```bash
npm install
```

### 2. Start the Servers

**Terminal 1 - Backend Server:**
```bash
python3 main.py
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

### 3. Open Your Browser

Visit: `http://localhost:5173`

You'll see the **Setup Wizard** which will guide you through:

## Setup Wizard Steps

### Step 1: OpenAI API Key
- Enter your OpenAI API key (get one from https://platform.openai.com/api-keys)
- The wizard validates the key immediately
- Key is automatically saved to your `.env` file

### Step 2: Create Assistant
- Click "Create Elias Assistant"
- The system automatically:
  - Creates the OpenAI Assistant
  - Uploads any files from `knowledge/` folder
  - Saves the Assistant ID to `.env`
- Takes 10-30 seconds depending on knowledge files

### Step 3: Initialize Personality
- Click "Initialize Personality"
- Loads Elias's witty personality configuration into the database
- Takes just a few seconds

### Step 4: Complete!
- Setup is done
- Click "Go to Dashboard" to start using the system

## What You Get

After setup, you'll have access to:

### Management Dashboard (`http://localhost:5173`)
Three tabs:
- **Conversations**: View and manage all past conversations
- **Reports**: Upload documents (PDF, DOCX, MD, TXT)
- **Settings**: Configure how often Elias references past conversations

### Voice Interface (`http://localhost:8000`)
- Click "Start" to record your voice
- Speak naturally
- Click "Stop" when done
- Elias responds with voice
- All conversations are automatically saved

## Optional: Pre-load Knowledge Files

Before running Step 2, you can add files to the `knowledge/` folder:

```bash
mkdir knowledge
# Add your PDF and TXT files here
```

These files will be automatically uploaded when you create the assistant.

## Re-running Setup

If you need to re-run any setup step:

1. The wizard automatically detects completed steps (green checkmarks)
2. You can click through completed steps to re-run them
3. Or manually edit `.env` to reset:
   - Remove `OPENAI_API_KEY` to reset Step 1
   - Remove `ASSISTANT_ID` to reset Step 2
   - Delete personality from database to reset Step 3

## Troubleshooting

**Wizard doesn't appear:**
- Check that both servers are running
- Clear browser cache and refresh
- Check browser console for errors

**API Key validation fails:**
- Verify the key starts with `sk-`
- Check you copied the full key
- Ensure the key is active in OpenAI dashboard

**Assistant creation fails:**
- Verify API key is valid
- Check you have credits in your OpenAI account
- Look at the terminal running `python3 main.py` for error details

**Can't upload knowledge files:**
- Ensure files are in `knowledge/` folder
- Only PDF and TXT files are supported at assistant creation
- Other formats (DOCX, MD) can be uploaded later via Reports tab

## Next Steps

1. Complete the setup wizard
2. Upload some reports in the Reports tab
3. Adjust reference settings in Settings tab
4. Open `http://localhost:8000` for voice conversations
5. Try asking Elias about your uploaded reports!

## System Requirements

- **Python**: 3.8+ (you have 3.13.5 ✓)
- **Node.js**: 16+ (you have v22.21.1 ✓)
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **OpenAI**: Active API key with credits

That's it! The setup wizard handles everything else automatically.
