from typing import List, Dict, Optional
import re
from openai import OpenAI
from db_client import supabase
import os


class EmbeddingService:

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[Dict]:
        words = text.split()
        chunks = []
        chunk_index = 0

        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i : i + chunk_size]
            chunk_text = " ".join(chunk_words)

            if len(chunk_text.strip()) > 50:
                chunks.append(
                    {"text": chunk_text, "index": chunk_index, "token_count": len(chunk_words)}
                )
                chunk_index += 1

        return chunks

    @staticmethod
    def extract_metadata(chunk_text: str, report_title: str) -> Dict:
        metadata = {"company": None, "section": None, "abstract": None, "fast_facts": [], "quote": None}

        company_patterns = [
            r"(?:Company|Corporation|Inc\.|LLC|Ltd\.?)\s+([A-Z][A-Za-z\s&]+)",
            r"([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})(?:\s+(?:Inc|LLC|Corp|Ltd))",
        ]

        for pattern in company_patterns:
            match = re.search(pattern, chunk_text)
            if match:
                metadata["company"] = match.group(1).strip()
                break

        if not metadata["company"] and report_title:
            metadata["company"] = report_title.split("-")[0].strip() if "-" in report_title else report_title

        section_patterns = [
            r"(?:^|\n)([A-Z][A-Za-z\s]+(?:Overview|Summary|Analysis|Findings|Conclusion)):",
            r"(?:^|\n)(?:Section|Chapter)\s+\d+[:\s]+([A-Z][A-Za-z\s]+)",
        ]

        for pattern in section_patterns:
            match = re.search(pattern, chunk_text)
            if match:
                metadata["section"] = match.group(1).strip()
                break

        sentences = re.split(r"[.!?]\s+", chunk_text)
        if sentences:
            metadata["abstract"] = sentences[0][:200] if sentences[0] else None

        bullet_points = re.findall(r"(?:^|\n)[-•*]\s+([^\n]+)", chunk_text)
        metadata["fast_facts"] = bullet_points[:3]

        quotes = re.findall(r'"([^"]{20,150})"', chunk_text)
        if quotes:
            metadata["quote"] = quotes[0]

        return metadata

    @staticmethod
    def generate_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        try:
            response = client.embeddings.create(input=text, model=model)
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise

    @staticmethod
    def process_and_store_chunks(
        report_id: str, content_text: str, report_title: str = ""
    ) -> int:
        try:
            chunks = EmbeddingService.chunk_text(content_text, chunk_size=700, overlap=100)

            stored_count = 0

            for chunk in chunks:
                metadata = EmbeddingService.extract_metadata(chunk["text"], report_title)

                embedding = EmbeddingService.generate_embedding(chunk["text"])

                chunk_data = {
                    "report_id": report_id,
                    "company": metadata["company"],
                    "section": metadata["section"],
                    "chunk_text": chunk["text"],
                    "abstract": metadata["abstract"],
                    "fast_facts": metadata["fast_facts"] if metadata["fast_facts"] else None,
                    "quote": metadata["quote"],
                    "embedding": embedding,
                    "chunk_index": chunk["index"],
                    "token_count": chunk["token_count"],
                }

                result = supabase.table("document_chunks").insert(chunk_data).execute()

                if result.data:
                    stored_count += 1

            print(f"Stored {stored_count} chunks for report {report_id}")
            return stored_count

        except Exception as e:
            print(f"Error processing chunks: {e}")
            raise

    @staticmethod
    def get_chunks_for_report(report_id: str) -> List[Dict]:
        try:
            result = (
                supabase.table("document_chunks")
                .select("*")
                .eq("report_id", report_id)
                .order("chunk_index")
                .execute()
            )

            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching chunks: {e}")
            return []

    @staticmethod
    def delete_chunks_for_report(report_id: str) -> bool:
        try:
            result = supabase.table("document_chunks").delete().eq("report_id", report_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting chunks: {e}")
            return False
