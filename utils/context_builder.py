from typing import List, Dict, Optional
from services.conversation_service import ConversationService
from services.reference_service import ReferenceService
import random

class ContextBuilder:

    @staticmethod
    def build_conversation_context(
        current_conversation_id: Optional[str] = None,
        user_message: str = "",
        max_conversations: int = 5
    ) -> str:
        reference_settings = ReferenceService.get_reference_frequency_setting()
        level = reference_settings.get("level", "sometimes")
        weight = reference_settings.get("weight", 0.5)

        if level == "never" or weight == 0:
            return ""

        should_include = ContextBuilder._should_include_context(level, weight)
        if not should_include:
            return ""

        recent_conversations = ConversationService.get_recent_conversations(
            limit=max_conversations,
            include_archived=False
        )

        if not recent_conversations:
            return ""

        if current_conversation_id:
            recent_conversations = [
                c for c in recent_conversations
                if c.get("id") != current_conversation_id
            ]

        relevant_conversations = ContextBuilder._filter_relevant_conversations(
            recent_conversations,
            user_message
        )

        if not relevant_conversations:
            return ""

        context_parts = ["\n--- Context from Past Conversations ---"]

        for conv in relevant_conversations[:3]:
            conv_id = conv.get("id")
            title = conv.get("title", "Untitled")
            started_at = conv.get("started_at", "")

            messages = ConversationService.get_conversation_messages(conv_id)

            if messages:
                context_parts.append(f"\nPast conversation: '{title}' (from {started_at[:10]})")

                for msg in messages[-4:]:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    speaker = "User" if role == "user" else "You"
                    context_parts.append(f"  {speaker}: {content[:200]}")

        context_parts.append("\n--- End of Past Conversation Context ---\n")

        return "\n".join(context_parts)

    @staticmethod
    def _should_include_context(level: str, weight: float) -> bool:
        level_probabilities = {
            "never": 0.0,
            "rarely": 0.2,
            "sometimes": 0.5,
            "often": 0.8,
            "always": 1.0
        }

        base_probability = level_probabilities.get(level, 0.5)
        final_probability = base_probability * weight

        return random.random() < final_probability

    @staticmethod
    def _filter_relevant_conversations(
        conversations: List[Dict],
        user_message: str
    ) -> List[Dict]:
        if not user_message or len(user_message) < 10:
            return conversations[:3]

        keywords = set(user_message.lower().split())
        keywords = {word for word in keywords if len(word) > 3}

        if not keywords:
            return conversations[:3]

        scored_conversations = []

        for conv in conversations:
            score = 0
            title = conv.get("title", "").lower()
            description = conv.get("description", "").lower()
            tags = conv.get("tags", [])

            for keyword in keywords:
                if keyword in title:
                    score += 3
                if keyword in description:
                    score += 2
                for tag in tags:
                    if keyword in tag.lower():
                        score += 2

            scored_conversations.append((score, conv))

        scored_conversations.sort(key=lambda x: x[0], reverse=True)

        relevant = [conv for score, conv in scored_conversations if score > 0]

        if not relevant:
            return conversations[:3]

        return relevant[:5]

    @staticmethod
    def build_personality_instructions(base_instructions: str) -> str:
        from services.personality_service import PersonalityService

        active_personality = PersonalityService.get_active_personality()

        if not active_personality:
            return base_instructions

        custom_instructions = active_personality.get("instructions", "")
        speaking_style = active_personality.get("speaking_style", {})
        knowledge_domains = active_personality.get("knowledge_domains", [])

        enhanced_instructions = f"{custom_instructions}\n\n"

        if speaking_style:
            style_desc = []
            if speaking_style.get("tone"):
                style_desc.append(f"Tone: {speaking_style['tone']}")
            if speaking_style.get("pace"):
                style_desc.append(f"Pace: {speaking_style['pace']}")
            if speaking_style.get("formality"):
                style_desc.append(f"Formality: {speaking_style['formality']}")

            if style_desc:
                enhanced_instructions += "Speaking Style:\n- " + "\n- ".join(style_desc) + "\n\n"

        if knowledge_domains:
            enhanced_instructions += f"Areas of Expertise: {', '.join(knowledge_domains)}\n\n"

        enhanced_instructions += base_instructions

        return enhanced_instructions
