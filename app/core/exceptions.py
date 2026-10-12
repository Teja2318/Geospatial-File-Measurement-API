"""Custom application exceptions."""

from __future__ import annotations


class GeoProcessingError(Exception):
    """Raised when geospatial file processing fails."""

    def __init__(self, message: str, detail: str = None):
        self.message = message
        self.detail = detail
        super().__init__(self.message)


class FileValidationError(Exception):
    """Raised when file validation fails."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class FileNotFoundError(Exception):
    """Raised when a requested file is not found."""

    def __init__(self, file_id: str):
        self.message = f"File with ID '{file_id}' not found"
        self.file_id = file_id
        super().__init__(self.message)


class UnsupportedFormatError(Exception):
    """Raised when file format is not supported."""

    def __init__(self, extension: str):
        self.message = f"Unsupported file format: '{extension}'"
        self.extension = extension
        super().__init__(self.message)


class CRSError(Exception):
    """Raised when CRS handling fails."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
