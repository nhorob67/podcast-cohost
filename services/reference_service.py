from typing import List, Optional, Dict
from datetime import datetime
from db_client import supabase

class ReferenceService:

    @staticmethod
    def add_reference(
        source_conversation_id: str,
        referenced_conversation_id: str,
        reference_text: str
    ) -> Dict:
        data = {
            "source_conversation_id": source_conversation_id,
            "referenced_conversation_id": referenced_conversation_id,
            "reference_text": reference_text,
            "timestamp": datetime.utcnow().isoformat()
        }

        result = supabase.table("conversation_references").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_references_for_conversation(conversation_id: str) -> List[Dict]:
        result = supabase.table("conversation_references").select("*").eq("source_conversation_id", conversation_id).execute()
        return result.data if result.data else []

    @staticmethod
    def get_conversations_that_reference(conversation_id: str) -> List[Dict]:
        result = supabase.table("conversation_references").select("*").eq("referenced_conversation_id", conversation_id).execute()
        return result.data if result.data else []

    @staticmethod
    def get_reference_frequency_setting() -> Dict:
        result = supabase.table("system_settings").select("value").eq("key", "reference_frequency").maybeSingle().execute()

        if result.data:
            return result.data["value"]

        return {"level": "sometimes", "weight": 0.5}

    @staticmethod
    def update_reference_frequency(level: str, weight: float) -> Dict:
        valid_levels = ["never", "rarely", "sometimes", "often", "always"]

        if level not in valid_levels:
            raise ValueError(f"Invalid level. Must be one of: {', '.join(valid_levels)}")

        if not 0 <= weight <= 1:
            raise ValueError("Weight must be between 0 and 1")

        data = {
            "level": level,
            "weight": weight
        }

        result = supabase.table("system_settings").update({"value": data}).eq("key", "reference_frequency").execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_max_context_conversations() -> int:
        result = supabase.table("system_settings").select("value").eq("key", "max_context_conversations").maybeSingle().execute()

        if result.data:
            return result.data["value"].get("count", 5)

        return 5

    @staticmethod
    def update_max_context_conversations(count: int) -> Dict:
        if count < 0:
            raise ValueError("Count must be non-negative")

        data = {"count": count}

        result = supabase.table("system_settings").update({"value": data}).eq("key", "max_context_conversations").execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_reference_stats() -> Dict:
        all_refs = supabase.table("conversation_references").select("referenced_conversation_id").execute()

        stats = {
            "total_references": 0,
            "unique_conversations_referenced": 0,
            "most_referenced": []
        }

        if all_refs.data:
            stats["total_references"] = len(all_refs.data)

            ref_counts = {}
            for ref in all_refs.data:
                conv_id = ref["referenced_conversation_id"]
                ref_counts[conv_id] = ref_counts.get(conv_id, 0) + 1

            stats["unique_conversations_referenced"] = len(ref_counts)

            sorted_refs = sorted(ref_counts.items(), key=lambda x: x[1], reverse=True)
            stats["most_referenced"] = [
                {"conversation_id": conv_id, "count": count}
                for conv_id, count in sorted_refs[:5]
            ]

        return stats
