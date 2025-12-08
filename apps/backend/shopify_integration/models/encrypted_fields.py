"""Encrypted field types for storing sensitive credentials."""

from __future__ import annotations

from django.db import models

from ..utils.encryption import CredentialEncryption


class EncryptedCharField(models.CharField):
    """CharField that automatically encrypts/decrypts values."""

    def from_db_value(self, value, expression, connection):
        """Decrypt value when reading from database."""
        if value is None:
            return value
        return CredentialEncryption.decrypt(value)

    def get_prep_value(self, value):
        """Encrypt value before saving to database."""
        if value is None:
            return value
        if CredentialEncryption.is_encrypted(value):
            # Already encrypted, return as-is
            return value
        return CredentialEncryption.encrypt(value)

    def to_python(self, value):
        """Convert value to Python string, decrypting if needed."""
        if isinstance(value, str):
            if CredentialEncryption.is_encrypted(value):
                return CredentialEncryption.decrypt(value)
            return value
        return value

