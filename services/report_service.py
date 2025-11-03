from typing import List, Optional, Dict
from datetime import datetime
import os
from pathlib import Path
from db_client import supabase

class ReportService:

    @staticmethod
    def create_report(
        title: str,
        file_type: str,
        file_size_bytes: int,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        openai_file_id: Optional[str] = None
    ) -> Dict:
        data = {
            "title": title,
            "description": description,
            "file_type": file_type,
            "file_size_bytes": file_size_bytes,
            "upload_date": datetime.utcnow().isoformat(),
            "tags": tags or [],
            "openai_file_id": openai_file_id,
            "processing_status": "pending"
        }

        result = supabase.table("reports").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def create_report_file(
        report_id: str,
        file_path: str,
        content_text: Optional[str] = None,
        version: int = 1
    ) -> Dict:
        data = {
            "report_id": report_id,
            "file_path": file_path,
            "content_text": content_text,
            "version": version
        }

        result = supabase.table("report_files").insert(data).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def update_report_status(report_id: str, status: str) -> Dict:
        result = supabase.table("reports").update({"processing_status": status}).eq("id", report_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_all_reports(limit: int = 50) -> List[Dict]:
        result = supabase.table("reports").select("*").order("upload_date", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def get_report_by_id(report_id: str) -> Optional[Dict]:
        result = supabase.table("reports").select("*").eq("id", report_id).maybeSingle().execute()
        return result.data

    @staticmethod
    def get_report_files(report_id: str) -> List[Dict]:
        result = supabase.table("report_files").select("*").eq("report_id", report_id).order("version", desc=True).execute()
        return result.data if result.data else []

    @staticmethod
    def search_reports(query: str, limit: int = 20) -> List[Dict]:
        result = supabase.table("reports").select("*").or_(f"title.ilike.%{query}%,description.ilike.%{query}%").order("upload_date", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def get_reports_by_tags(tags: List[str], limit: int = 20) -> List[Dict]:
        result = supabase.table("reports").select("*").contains("tags", tags).order("upload_date", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def delete_report(report_id: str) -> bool:
        result = supabase.table("reports").delete().eq("id", report_id).execute()
        return len(result.data) > 0 if result.data else False

    @staticmethod
    def update_report(report_id: str, updates: Dict) -> Dict:
        result = supabase.table("reports").update(updates).eq("id", report_id).execute()
        return result.data[0] if result.data else None

    @staticmethod
    def get_reports_by_type(file_type: str, limit: int = 20) -> List[Dict]:
        result = supabase.table("reports").select("*").eq("file_type", file_type).order("upload_date", desc=True).limit(limit).execute()
        return result.data if result.data else []

    @staticmethod
    def get_processing_stats() -> Dict:
        all_reports = supabase.table("reports").select("processing_status").execute()

        stats = {
            "total": 0,
            "pending": 0,
            "processing": 0,
            "completed": 0,
            "failed": 0
        }

        if all_reports.data:
            stats["total"] = len(all_reports.data)
            for report in all_reports.data:
                status = report.get("processing_status", "pending")
                if status in stats:
                    stats[status] += 1

        return stats
