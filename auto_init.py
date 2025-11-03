import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from services.personality_service import PersonalityService

load_dotenv()

def load_personality_from_json(json_path: str):
    with open(json_path, 'r') as f:
        return json.load(f)

def initialize_personality():
    try:
        active_personality = PersonalityService.get_active_personality()
        if active_personality:
            print(f"✓ Personality already initialized: {active_personality['name']}")
            return True

        default_personality_path = Path("personality/default_elias.json")
        if not default_personality_path.exists():
            print("✗ Default personality file not found")
            return False

        personality_data = load_personality_from_json(default_personality_path)

        PersonalityService.create_personality(
            name=personality_data["name"],
            instructions=personality_data["instructions"],
            speaking_style=personality_data.get("speaking_style"),
            knowledge_domains=personality_data.get("knowledge_domains", []),
            is_active=True
        )

        print(f"✓ Personality initialized: {personality_data['name']}")
        return True

    except Exception as e:
        print(f"✗ Failed to initialize personality: {e}")
        return False

def create_assistant():
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("✗ OPENAI_API_KEY not set in environment")
        return None

    assistant_id = os.getenv("ASSISTANT_ID")
    if assistant_id:
        print(f"✓ Assistant already created: {assistant_id}")
        return assistant_id

    try:
        client = OpenAI(api_key=openai_api_key)

        active_personality = PersonalityService.get_active_personality()
        if not active_personality:
            print("✗ No active personality found. Initialize personality first.")
            return None

        instructions = active_personality["instructions"]

        knowledge_path = Path("knowledge")
        file_ids = []

        if knowledge_path.exists() and knowledge_path.is_dir():
            knowledge_files = list(knowledge_path.glob("*"))
            supported_extensions = ['.txt', '.md', '.pdf', '.docx']

            for file_path in knowledge_files:
                if file_path.suffix.lower() in supported_extensions:
                    try:
                        with open(file_path, "rb") as f:
                            uploaded_file = client.files.create(file=f, purpose="assistants")
                            file_ids.append(uploaded_file.id)
                            print(f"  Uploaded: {file_path.name}")
                    except Exception as e:
                        print(f"  Failed to upload {file_path.name}: {e}")

        assistant = client.beta.assistants.create(
            name="Elias",
            instructions=instructions,
            model="gpt-4-turbo-preview",
            tools=[{"type": "file_search"}] if file_ids else []
        )

        if file_ids:
            vector_store = client.beta.vector_stores.create(name="Elias Knowledge Base")
            client.beta.vector_stores.file_batches.create(
                vector_store_id=vector_store.id,
                file_ids=file_ids
            )
            client.beta.assistants.update(
                assistant.id,
                tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}}
            )

        env_path = Path(".env")
        if env_path.exists():
            with open(env_path, 'r') as f:
                lines = f.readlines()

            with open(env_path, 'w') as f:
                assistant_written = False
                for line in lines:
                    if line.startswith('ASSISTANT_ID='):
                        f.write(f'ASSISTANT_ID={assistant.id}\n')
                        assistant_written = True
                    else:
                        f.write(line)

                if not assistant_written:
                    f.write(f'\nASSISTANT_ID={assistant.id}\n')

        print(f"✓ Assistant created: {assistant.id}")
        print(f"  Files uploaded: {len(file_ids)}")
        return assistant.id

    except Exception as e:
        print(f"✗ Failed to create assistant: {e}")
        return None

def auto_initialize():
    print("\n=== Elias Auto-Initialization ===\n")

    print("Checking OpenAI API Key...")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("✗ OPENAI_API_KEY not found in environment")
        print("\nPlease set your OpenAI API key in the .env file:")
        print("  OPENAI_API_KEY=sk-your-key-here")
        return False

    print("✓ OpenAI API Key configured\n")

    print("Initializing personality...")
    if not initialize_personality():
        return False

    print("\nCreating/checking assistant...")
    if not create_assistant():
        return False

    print("\n=== Initialization Complete ===\n")
    return True

if __name__ == "__main__":
    auto_initialize()
