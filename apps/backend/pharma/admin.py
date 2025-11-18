from django.contrib import admin
from .models import (
    DrugProduct, PackagingLevel, DrugBatch,
    DrugDispensing, DrugInventory
)


@admin.register(DrugProduct)
class DrugProductAdmin(admin.ModelAdmin):
    list_display = [
        'product_code', 'generic_name', 'brand_name', 'strength',
        'dosage_form', 'status', 'requires_prescription'
    ]
    list_filter = [
        'dosage_form', 'route_of_administration', 'therapeutic_class',
        'status', 'requires_prescription', 'is_controlled_substance',
        'requires_cold_chain'
    ]
    search_fields = [
        'generic_name', 'brand_name', 'product_code',
        'barcode', 'gtin', 'active_ingredients'
    ]
    readonly_fields = ['product_code', 'created_at', 'updated_at']
    fieldsets = (
        ('Identification', {
            'fields': ('product_code', 'generic_name', 'brand_name')
        }),
        ('Dosage Information', {
            'fields': ('dosage_form', 'strength', 'route_of_administration')
        }),
        ('Classification', {
            'fields': ('therapeutic_class', 'pharmacological_class')
        }),
        ('Regulatory', {
            'fields': (
                'marketing_authorization_number', 'gtin', 'barcode', 'ndc_code',
                'requires_prescription', 'is_controlled_substance', 'controlled_substance_schedule'
            )
        }),
        ('Storage & Handling', {
            'fields': (
                'storage_conditions', 'storage_instructions',
                'requires_cold_chain'
            )
        }),
        ('Additional Information', {
            'fields': (
                'manufacturer', 'importer', 'active_ingredients',
                'description', 'warnings'
            )
        }),
        ('Status & Relations', {
            'fields': ('status', 'supplier')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PackagingLevel)
class PackagingLevelAdmin(admin.ModelAdmin):
    list_display = [
        'drug_product', 'level_name', 'level_order',
        'base_unit_quantity', 'unit_of_measure',
        'can_dispense', 'can_purchase'
    ]
    list_filter = ['unit_of_measure', 'can_dispense', 'can_purchase']
    search_fields = ['level_name', 'drug_product__generic_name', 'barcode']
    ordering = ['drug_product', 'level_order']


@admin.register(DrugBatch)
class DrugBatchAdmin(admin.ModelAdmin):
    list_display = [
        'batch_number', 'drug_product', 'manufacture_date',
        'expiry_date', 'current_quantity', 'status',
        'warehouse', 'days_until_expiry'
    ]
    list_filter = [
        'status', 'warehouse', 'expiry_date', 'manufacture_date'
    ]
    search_fields = [
        'batch_number', 'lot_number',
        'drug_product__generic_name', 'drug_product__brand_name'
    ]
    readonly_fields = ['days_until_expiry', 'is_expired', 'created_at', 'updated_at']
    date_hierarchy = 'expiry_date'
    
    fieldsets = (
        ('Identification', {
            'fields': ('drug_product', 'batch_number', 'lot_number')
        }),
        ('Dates', {
            'fields': (
                'manufacture_date', 'expiry_date',
                'days_until_expiry', 'is_expired'
            )
        }),
        ('Quantity', {
            'fields': (
                'initial_quantity', 'current_quantity', 'packaging_level'
            )
        }),
        ('Quality Control', {
            'fields': ('status', 'certificate_of_analysis', 'qc_notes')
        }),
        ('Location', {
            'fields': ('warehouse', 'storage_location')
        }),
        ('Traceability', {
            'fields': ('serial_numbers', 'supplier', 'purchase_order_number')
        }),
        ('Cost', {
            'fields': ('unit_cost',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def days_until_expiry(self, obj):
        return obj.days_until_expiry()
    days_until_expiry.short_description = 'Days Until Expiry'


@admin.register(DrugDispensing)
class DrugDispensingAdmin(admin.ModelAdmin):
    list_display = [
        'dispensing_number', 'drug_product', 'batch',
        'quantity_dispensed', 'packaging_level',
        'patient_name', 'dispensing_date', 'total_price'
    ]
    list_filter = [
        'dispensing_date', 'packaging_level', 'drug_product'
    ]
    search_fields = [
        'dispensing_number', 'patient_name', 'prescription_number',
        'prescriber_name', 'drug_product__generic_name'
    ]
    readonly_fields = [
        'dispensing_number', 'quantity_in_base_units',
        'total_price', 'dispensing_date', 'created_at'
    ]
    date_hierarchy = 'dispensing_date'
    
    fieldsets = (
        ('Dispensing Information', {
            'fields': (
                'dispensing_number', 'drug_product', 'batch',
                'packaging_level', 'quantity_dispensed',
                'quantity_in_base_units'
            )
        }),
        ('Transaction', {
            'fields': ('sales_order', 'unit_price', 'total_price')
        }),
        ('Patient/Customer', {
            'fields': (
                'customer', 'patient_name', 'prescription_number'
            )
        }),
        ('Prescriber', {
            'fields': ('prescriber_name', 'prescriber_license')
        }),
        ('Metadata', {
            'fields': (
                'dispensed_by', 'dispensing_date', 'dispensing_notes'
            )
        })
    )


@admin.register(DrugInventory)
class DrugInventoryAdmin(admin.ModelAdmin):
    list_display = [
        'drug_product', 'warehouse', 'packaging_level',
        'quantity_available', 'quantity_reserved', 'quantity_quarantine',
        'reorder_level', 'is_below_reorder_level', 'last_updated'
    ]
    list_filter = [
        'warehouse', 'packaging_level', 'last_updated'
    ]
    search_fields = [
        'drug_product__generic_name', 'drug_product__brand_name',
        'warehouse__name'
    ]
    readonly_fields = ['total_quantity', 'is_below_reorder_level', 'last_updated']
    
    def total_quantity(self, obj):
        return obj.total_quantity
    total_quantity.short_description = 'Total Quantity'

