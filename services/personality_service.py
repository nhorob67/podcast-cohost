from typing import List, Optional, Dict
from datetime import datetime
from db_client import supabase

class PersonalityService:

    @staticmethod
    def create_personality(
        name: str,
        instructions: str,
        speaking_style: Optional[Dict] = None,
        knowledge_domains: Optional[List[str]] = None,
        is_active: bool = False
    ) -> Dict:
        if is_active:
            PersonalityService._deactivate_all_personalities()

        data = {
            "name": name,
            "instructions": instructions,
            "speaking_style": speaking_style,
            "knowledge_domains": knowledge_domains or [],
            "is_active": is_active,
            "version": 1
        }

        result = supabase.table("personality_config").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_active_personality() -> Optional[Dict]:
        result = supabase.table("personality_config").select("*").eq("is_active", True).maybeSingle().execute()
        return result.data

    @staticmethod
    def get_all_personalities() -> List[Dict]:
        result = supabase.table("personality_config").select("*").order("created_at", desc=True).execute()
        return result.data if result.data else []

    @staticmethod
    def get_personality_by_id(personality_id: str) -> Optional[Dict]:
        result = supabase.table("personality_config").select("*").eq("id", personality_id).maybeSingle().execute()
        return result.data

    @staticmethod
    def update_personality(personality_id: str, updates: Dict) -> Dict:
        result = supabase.table("personality_config").update(updates).eq("id", personality_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def activate_personality(personality_id: str) -> Dict:
        PersonalityService._deactivate_all_personalities()

        result = supabase.table("personality_config").update({"is_active": True}).eq("id", personality_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def _deactivate_all_personalities():
        supabase.table("personality_config").update({"is_active": False}).eq("is_active", True).execute()

    @staticmethod
    def delete_personality(personality_id: str) -> bool:
        result = supabase.table("personality_config").delete().eq("id", personality_id).execute()
        return len(result.data) > 0 if result.data else False

    @staticmethod
    def create_personality_version(personality_id: str, updates: Dict) -> Dict:
        current = PersonalityService.get_personality_by_id(personality_id)

        if not current:
            raise ValueError(f"Personality {personality_id} not found")

        new_version = current.get("version", 1) + 1
        updates["version"] = new_version

        result = supabase.table("personality_config").update(updates).eq("id", personality_id).execute()
        return result.data[0] if result.data else None
