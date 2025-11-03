from typing import List, Optional, Dict
from datetime import datetime
from db_client import supabase

class ConversationService:

    @staticmethod
    def create_conversation(thread_id: str, title: str = "Untitled Conversation", description: Optional[str] = None) -> Dict:
        data = {
            "thread_id": thread_id,
            "title": title,
            "description": description,
            "started_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("conversations").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def end_conversation(conversation_id: str, duration_seconds: int) -> Dict:
        data = {
            "ended_at": datetime.utcnow().isoformat(),
            "duration_seconds": duration_seconds
        }

        result = supabase.table("conversations").update(data).eq("id", conversation_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def add_message(conversation_id: str, role: str, content: str, audio_url: Optional[str] = None) -> Dict:
        data = {
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "audio_url": audio_url,
            "timestamp": datetime.utcnow().isoformat()
        }

        result = supabase.table("messages").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_conversation_by_thread_id(thread_id: str) -> Optional[Dict]:
        result = supabase.table("conversations").select("*").eq("thread_id", thread_id).maybeSingle().execute()
        return result.data

    @staticmethod
    def get_conversation_messages(conversation_id: str) -> List[Dict]:
        result = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("timestamp").execute()
        return result.data if result.data else []

    @staticmethod
    def get_recent_conversations(limit: int = 10, include_archived: bool = False) -> List[Dict]:
        query = supabase.table("conversations").select("*")

        if not include_archived:
            query = query.eq("is_archived", False)

        result = query.order("started_at", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def search_conversations(query: str, limit: int = 20) -> List[Dict]:
        result = supabase.table("conversations").select("*").ilike("title", f"%{query}%").eq("is_archived", False).order("started_at", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def archive_conversation(conversation_id: str) -> Dict:
        result = supabase.table("conversations").update({"is_archived": True}).eq("id", conversation_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def delete_conversation(conversation_id: str) -> bool:
        result = supabase.table("conversations").delete().eq("id", conversation_id).execute()
        return len(result.data) > 0 if result.data else False

    @staticmethod
    def update_conversation_title(conversation_id: str, title: str) -> Dict:
        result = supabase.table("conversations").update({"title": title}).eq("id", conversation_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def add_conversation_tags(conversation_id: str, tags: List[str]) -> Dict:
        result = supabase.table("conversations").update({"tags": tags}).eq("id", conversation_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_conversations_by_tags(tags: List[str], limit: int = 20) -> List[Dict]:
        result = supabase.table("conversations").select("*").contains("tags", tags).eq("is_archived", False).order("started_at", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def import_conversation(thread_id: str, title: str, messages: List[Dict], started_at: Optional[str] = None) -> Dict:
        conversation_data = {
            "thread_id": thread_id,
            "title": title,
            "started_at": started_at or datetime.utcnow().isoformat()
        }

        conversation_result = supabase.table("conversations").insert(conversation_data).execute()

        if not conversation_result.data:
            raise Exception("Failed to create conversation during import")

        conversation = conversation_result.data[0]
        conversation_id = conversation["id"]

        for msg in messages:
            msg["conversation_id"] = conversation_id
            if "timestamp" not in msg:
                msg["timestamp"] = datetime.utcnow().isoformat()

        supabase.table("messages").insert(messages).execute()

        return conversation
