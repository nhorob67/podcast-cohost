import json
from pathlib import Path
from services.personality_service import PersonalityService

def load_default_personality():
    personality_file = Path("personality/default_elias.json")

    if not personality_file.exists():
        print("Default personality file not found.")
        return

    with open(personality_file, 'r') as f:
        personality_data = json.load(f)

    try:
        existing = PersonalityService.get_active_personality()

        if existing:
            print(f"Active personality already exists: {existing['name']}")
            response = input("Do you want to create a new version? (y/n): ")
            if response.lower() != 'y':
                return

        personality = PersonalityService.create_personality(
            name=personality_data['name'],
            instructions=personality_data['instructions'],
            speaking_style=personality_data.get('speaking_style'),
            knowledge_domains=personality_data.get('knowledge_domains'),
            is_active=True
        )

        print(f"\n✓ Personality '{personality['name']}' created and activated!")
        print(f"  ID: {personality['id']}")
        print(f"  Version: {personality['version']}")

    except Exception as e:
        print(f"Error creating personality: {e}")

if __name__ == "__main__":
    print("="*60)
    print("Initialize Default Personality")
    print("="*60)
    load_default_personality()
