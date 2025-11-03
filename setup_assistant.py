import os
import sys
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def upload_knowledge_files(client, knowledge_folder="knowledge"):
    knowledge_path = Path(knowledge_folder)

    if not knowledge_path.exists():
        print(f"Creating {knowledge_folder} folder...")
        knowledge_path.mkdir(parents=True, exist_ok=True)
        print(f"Please add your PDF and text files to the '{knowledge_folder}' folder and run this script again.")
        return []

    files = list(knowledge_path.glob("*.pdf")) + list(knowledge_path.glob("*.txt"))

    if not files:
        print(f"No PDF or TXT files found in '{knowledge_folder}' folder.")
        print("Please add some files and run this script again.")
        return []

    print(f"\nFound {len(files)} files to upload:")
    for f in files:
        print(f"  - {f.name}")

    file_ids = []
    print("\nUploading files to OpenAI...")

    for file_path in files:
        try:
            with open(file_path, "rb") as f:
                file_obj = client.files.create(
                    file=f,
                    purpose="assistants"
                )
                file_ids.append(file_obj.id)
                print(f"  ✓ Uploaded {file_path.name} (ID: {file_obj.id})")
        except Exception as e:
            print(f"  ✗ Failed to upload {file_path.name}: {e}")

    return file_ids

def create_elias_assistant(client, file_ids):
    print("\nCreating Elias assistant...")

    elias_instructions = """You are Elias, a witty and insightful business expert with years of experience
consulting for startups and Fortune 500 companies alike. Your personality is warm, engaging, and slightly
irreverent - you're not afraid to challenge conventional wisdom with a clever quip.

You have a knack for breaking down complex business concepts into digestible insights, often using
unexpected analogies that make people laugh while they learn. You're the kind of expert who can discuss
quarterly earnings and then pivot to a pop culture reference without missing a beat.

Your speaking style is conversational and natural, like you're having a coffee chat with a friend.
You occasionally use phrases like "Here's the thing..." or "Let me tell you..." to add personality.

You have access to a knowledge base of articles and notes. Use this information to provide informed,
specific answers while maintaining your characteristic wit and warmth. If you don't know something,
you'll say so honestly - no bluffing.

Keep your responses concise and conversational, as this is a spoken dialogue. Aim for 2-3 sentences
unless more detail is specifically requested."""

    tools = [{"type": "file_search"}]

    tool_resources = {}
    if file_ids:
        vector_store = client.beta.vector_stores.create(
            name="Elias Knowledge Base"
        )

        client.beta.vector_stores.file_batches.create(
            vector_store_id=vector_store.id,
            file_ids=file_ids
        )

        tool_resources = {
            "file_search": {
                "vector_store_ids": [vector_store.id]
            }
        }
        print(f"  ✓ Created vector store with {len(file_ids)} files")

    assistant = client.beta.assistants.create(
        name="Elias",
        instructions=elias_instructions,
        model="gpt-4o",
        tools=tools,
        tool_resources=tool_resources
    )

    print(f"  ✓ Assistant created successfully!")
    print(f"\n{'='*60}")
    print(f"ASSISTANT ID: {assistant.id}")
    print(f"{'='*60}")
    print(f"\nAdd this to your .env file:")
    print(f"ASSISTANT_ID={assistant.id}")

    return assistant

def main():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please create a .env file with your OpenAI API key:")
        print("OPENAI_API_KEY=your-api-key-here")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    print("="*60)
    print("Elias Assistant Setup")
    print("="*60)

    file_ids = upload_knowledge_files(client, "knowledge")

    assistant = create_elias_assistant(client, file_ids)

    print("\n✓ Setup complete! Elias is ready to chat.")
    print("\nNext steps:")
    print("1. Copy the ASSISTANT_ID to your .env file")
    print("2. Run your FastAPI server: uvicorn main:app --reload")
    print("3. Open index.html in your browser")

if __name__ == "__main__":
    main()
