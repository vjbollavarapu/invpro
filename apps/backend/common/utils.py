"""
Utility functions for common operations across the application.
"""
from django.db import transaction


def get_next_number(tenant, entity_type):
    """
    Get next auto-generated number for entity type.
    Thread-safe implementation using select_for_update.
    
    Args:
        tenant: Tenant instance
        entity_type: str - 'product', 'order', 'purchase_order', etc.
    
    Returns:
        str: Formatted number like "PRD-001" or "PO-2024-001"
    
    Example:
        >>> tenant = Tenant.objects.get(id=1)
        >>> number = get_next_number(tenant, 'product')
        >>> print(number)  # "PRD-001"
    """
    from common.models import NumberSequence
    
    with transaction.atomic():
        # Get or create number sequence config for this tenant and entity
        # Use select_for_update to prevent race conditions
        sequence, created = NumberSequence.objects.select_for_update().get_or_create(
            tenant_id=tenant.id,
            entity_type=entity_type,
            defaults={
                'prefix': get_default_prefix(entity_type),
                'padding': 3,
                'separator': '-',
            }
        )
        
        # If we just created it, lock it anyway for consistency
        if not created:
            sequence = NumberSequence.objects.select_for_update().get(
                tenant_id=tenant.id,
                entity_type=entity_type
            )
        
        # Generate and return the next number
        return sequence.get_next_number()


def get_default_prefix(entity_type):
    """
    Get default prefix for entity type.
    
    Args:
        entity_type: str - Entity type identifier
    
    Returns:
        str: Default prefix for the entity type
    """
    prefixes = {
        'product': 'PRD',
        'order': 'ORD',
        'purchase_order': 'PO',
        'purchase_request': 'PR',
        'warehouse': 'WH',
        'transfer': 'TRF',
        'supplier': 'SUP',
        'customer': 'CUST',
    }
    return prefixes.get(entity_type, 'DOC')


def reset_sequence(tenant, entity_type, new_value=0):
    """
    Reset a number sequence to a specific value.
    Useful for data migrations or corrections.
    
    Args:
        tenant: Tenant instance
        entity_type: str - Entity type identifier
        new_value: int - Value to reset to (default: 0)
    
    Returns:
        NumberSequence: The updated sequence object
    """
    from common.models import NumberSequence
    
    with transaction.atomic():
        sequence = NumberSequence.objects.select_for_update().get(
            tenant_id=tenant.id,
            entity_type=entity_type
        )
        sequence.current_sequence = new_value
        sequence.save()
        return sequence


def bulk_generate_numbers(tenant, entity_type, count):
    """
    Generate multiple numbers at once.
    Useful for batch operations or testing.
    
    Args:
        tenant: Tenant instance
        entity_type: str - Entity type identifier
        count: int - Number of numbers to generate
    
    Returns:
        list: List of generated numbers
    """
    numbers = []
    for _ in range(count):
        numbers.append(get_next_number(tenant, entity_type))
    return numbers

