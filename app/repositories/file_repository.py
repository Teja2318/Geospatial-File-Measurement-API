"""File repository for persisting file metadata and measurement results.

Uses JSON files for persistence so data survives server restarts.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import METADATA_DIR

logger = logging.getLogger(__name__)


class FileRepository:
    """Manages file metadata and measurement persistence using JSON files."""

    def __init__(self, metadata_dir: Optional[Path] = None):
        self.metadata_dir = metadata_dir or METADATA_DIR
        self.metadata_dir.mkdir(parents=True, exist_ok=True)

    def _get_metadata_path(self, file_id: str) -> Path:
        """Get the path to a file's metadata JSON."""
        # Sanitize file_id to prevent path traversal
        safe_id = file_id.replace("/", "").replace("\\", "").replace("..", "")
        return self.metadata_dir / f"{safe_id}.json"

    def save(self, file_id: str, data: Dict[str, Any]) -> None:
        """Save file metadata to disk."""
        path = self._get_metadata_path(file_id)
        # Serialize datetime objects
        serializable = self._make_serializable(data)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, default=str)

    def get(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve file metadata by ID."""
        path = self._get_metadata_path(file_id)
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            logger.error("Failed to read metadata for %s: %s", file_id, e)
            return None

    def get_all(self) -> List[Dict[str, Any]]:
        """Retrieve all file metadata records."""
        records = []
        for path in sorted(self.metadata_dir.glob("*.json")):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    records.append(json.load(f))
            except (json.JSONDecodeError, OSError) as e:
                logger.error("Failed to read %s: %s", path, e)
        return records

    def delete(self, file_id: str) -> bool:
        """Delete file metadata. Returns True if deleted, False if not found."""
        path = self._get_metadata_path(file_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def exists(self, file_id: str) -> bool:
        """Check if file metadata exists."""
        return self._get_metadata_path(file_id).exists()

    def _make_serializable(self, obj: Any) -> Any:
        """Convert non-serializable objects to serializable types."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        if hasattr(obj, "value"):  # Enum
            return obj.value
        return obj


# Singleton instance
file_repository = FileRepository()
