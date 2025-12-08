"""Utility functions for encrypting and decrypting sensitive credentials."""

from __future__ import annotations

import base64
import logging
import os

from cryptography.fernet import Fernet
from django.conf import settings

logger = logging.getLogger(__name__)


class CredentialEncryption:
    """Handles encryption and decryption of API credentials."""

    _fernet: Fernet | None = None

    @classmethod
    def _get_fernet(cls) -> Fernet:
        """Get or create Fernet cipher instance."""
        if cls._fernet is None:
            # Get encryption key from settings or environment
            encryption_key = getattr(settings, 'CREDENTIAL_ENCRYPTION_KEY', None)
            if not encryption_key:
                # Try to get from environment
                encryption_key = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
            
            if not encryption_key:
                # Generate a key from Django's SECRET_KEY (for development)
                # In production, set CREDENTIAL_ENCRYPTION_KEY explicitly
                import hashlib
                key_material = settings.SECRET_KEY.encode()
                key = base64.urlsafe_b64encode(hashlib.sha256(key_material).digest())
                encryption_key = key.decode()
                logger.warning(
                    "Using SECRET_KEY-derived encryption key. "
                    "Set CREDENTIAL_ENCRYPTION_KEY in production for better security."
                )
            
            cls._fernet = Fernet(encryption_key.encode())
        
        return cls._fernet

    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """Encrypt a plaintext string."""
        if not plaintext:
            return ''
        
        try:
            fernet = cls._get_fernet()
            encrypted = fernet.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error("Failed to encrypt credential: %s", str(e))
            raise

    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        """Decrypt an encrypted string."""
        if not ciphertext:
            return ''
        
        try:
            fernet = cls._get_fernet()
            decrypted = fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error("Failed to decrypt credential: %s", str(e))
            # If decryption fails, assume it's plaintext (for backward compatibility)
            logger.warning("Decryption failed, assuming plaintext for backward compatibility")
            return ciphertext

    @classmethod
    def is_encrypted(cls, value: str) -> bool:
        """Check if a value appears to be encrypted."""
        if not value:
            return False
        try:
            # Encrypted values are base64-encoded and have specific format
            base64.urlsafe_b64decode(value)
            return True
        except Exception:
            return False

