from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from common.models import TenantAwareModel


class DrugProduct(TenantAwareModel):
    """
    Comprehensive pharmaceutical product master with regulatory compliance
    """
    # Product Identification
    product_code = models.CharField(max_length=100, blank=True, db_index=True, help_text="Internal product code")
    
    # Drug-specific information
    generic_name = models.CharField(max_length=200, help_text="Generic/INN name")
    brand_name = models.CharField(max_length=200, blank=True, help_text="Brand/trade name")
    
    # Dosage Information
    DOSAGE_FORM_CHOICES = [
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('suspension', 'Suspension'),
        ('injection', 'Injection'),
        ('cream', 'Cream'),
        ('ointment', 'Ointment'),
        ('drops', 'Drops'),
        ('inhaler', 'Inhaler'),
        ('powder', 'Powder'),
        ('solution', 'Solution'),
        ('other', 'Other'),
    ]
    dosage_form = models.CharField(max_length=50, choices=DOSAGE_FORM_CHOICES)
    strength = models.CharField(max_length=100, help_text="e.g., 500mg, 10mg/ml")
    
    # Administration
    ROUTE_CHOICES = [
        ('oral', 'Oral'),
        ('topical', 'Topical'),
        ('intravenous', 'Intravenous (IV)'),
        ('intramuscular', 'Intramuscular (IM)'),
        ('subcutaneous', 'Subcutaneous (SC)'),
        ('inhalation', 'Inhalation'),
        ('rectal', 'Rectal'),
        ('ophthalmic', 'Ophthalmic'),
        ('otic', 'Otic'),
        ('nasal', 'Nasal'),
        ('transdermal', 'Transdermal'),
    ]
    route_of_administration = models.CharField(max_length=50, choices=ROUTE_CHOICES)
    
    # Classification
    therapeutic_class = models.CharField(max_length=200, help_text="e.g., Antibiotic, Analgesic")
    pharmacological_class = models.CharField(max_length=200, blank=True, help_text="e.g., Beta-lactam")
    
    # Regulatory Identifiers
    marketing_authorization_number = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Registration/MA number"
    )
    gtin = models.CharField(max_length=14, blank=True, help_text="Global Trade Item Number")
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    ndc_code = models.CharField(max_length=50, blank=True, help_text="National Drug Code")
    
    # Storage & Handling
    STORAGE_CONDITION_CHOICES = [
        ('room_temp', 'Room Temperature (15-25°C)'),
        ('cool', 'Cool (8-15°C)'),
        ('refrigerated', 'Refrigerated (2-8°C)'),
        ('frozen', 'Frozen (-15°C or below)'),
        ('controlled_room', 'Controlled Room Temperature (20-25°C)'),
    ]
    storage_conditions = models.CharField(max_length=50, choices=STORAGE_CONDITION_CHOICES)
    storage_instructions = models.TextField(blank=True, help_text="Additional storage requirements")
    
    # Special Handling
    requires_cold_chain = models.BooleanField(default=False)
    requires_prescription = models.BooleanField(default=True)
    is_controlled_substance = models.BooleanField(default=False)
    controlled_substance_schedule = models.CharField(max_length=20, blank=True, help_text="e.g., Schedule II")
    
    # Additional Information
    manufacturer = models.CharField(max_length=200, blank=True)
    importer = models.CharField(max_length=200, blank=True)
    active_ingredients = models.TextField(help_text="Comma-separated list of active ingredients")
    description = models.TextField(blank=True)
    warnings = models.TextField(blank=True, help_text="Warnings and precautions")
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('discontinued', 'Discontinued'),
        ('recalled', 'Recalled'),
        ('pending_approval', 'Pending Approval'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Relationships
    supplier = models.ForeignKey(
        'procurement.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='drug_products'
    )
    
    class Meta:
        unique_together = ('tenant_id', 'product_code')
        indexes = [
            models.Index(fields=['tenant_id', 'generic_name']),
            models.Index(fields=['tenant_id', 'brand_name']),
            models.Index(fields=['tenant_id', 'barcode']),
            models.Index(fields=['tenant_id', 'status']),
        ]
        ordering = ['generic_name', 'strength']
    
    def save(self, *args, **kwargs):
        if not self.product_code:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.product_code = get_next_number(tenant, 'drug_product')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.generic_name} {self.strength} ({self.dosage_form})"


class PackagingLevel(TenantAwareModel):
    """
    Define packaging hierarchy for pharmaceutical products
    e.g., Tablet → Strip → Box → Carton → Pallet
    """
    drug_product = models.ForeignKey(DrugProduct, on_delete=models.CASCADE, related_name='packaging_levels')
    
    # Packaging Definition
    level_name = models.CharField(max_length=100, help_text="e.g., Tablet, Strip, Box, Carton, Pallet")
    level_order = models.IntegerField(
        help_text="Hierarchy order: 1=smallest (tablet/ml), 2=strip/bottle, 3=box, etc."
    )
    
    # Unit Information
    base_unit_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
        help_text="Quantity of base units in this packaging (e.g., 10 tablets per strip)"
    )
    
    UNIT_OF_MEASURE_CHOICES = [
        ('unit', 'Unit (ea)'),
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('ml', 'Milliliter'),
        ('gm', 'Gram'),
        ('strip', 'Strip'),
        ('bottle', 'Bottle'),
        ('vial', 'Vial'),
        ('ampoule', 'Ampoule'),
        ('box', 'Box'),
        ('carton', 'Carton'),
        ('pallet', 'Pallet'),
    ]
    unit_of_measure = models.CharField(max_length=50, choices=UNIT_OF_MEASURE_CHOICES)
    
    # Packaging Details
    packaging_description = models.TextField(blank=True)
    
    # Barcodes and Identifiers
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    gtin = models.CharField(max_length=14, blank=True)
    
    # Pricing (at this packaging level)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Dispensing Configuration
    can_dispense = models.BooleanField(
        default=True,
        help_text="Can this packaging level be sold directly to customers?"
    )
    can_purchase = models.BooleanField(
        default=True,
        help_text="Can this packaging level be purchased from suppliers?"
    )
    
    # Physical Dimensions (optional)
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="in cm")
    width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="in cm")
    height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="in cm")
    weight = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True, help_text="in kg")
    
    class Meta:
        unique_together = ('drug_product', 'level_order')
        ordering = ['drug_product', 'level_order']
        indexes = [
            models.Index(fields=['tenant_id', 'drug_product', 'level_order']),
            models.Index(fields=['barcode']),
        ]
    
    def __str__(self):
        return f"{self.drug_product.generic_name} - {self.level_name} (Level {self.level_order})"
    
    def convert_to_base_units(self, quantity: Decimal) -> Decimal:
        """Convert quantity at this level to base units"""
        return quantity * self.base_unit_quantity
    
    def convert_from_base_units(self, base_quantity: Decimal) -> Decimal:
        """Convert base units to this packaging level"""
        return base_quantity / self.base_unit_quantity


class DrugBatch(TenantAwareModel):
    """
    Track individual batches/lots of pharmaceutical products
    """
    drug_product = models.ForeignKey(DrugProduct, on_delete=models.CASCADE, related_name='batches')
    
    # Batch Identification
    batch_number = models.CharField(max_length=100, db_index=True)
    lot_number = models.CharField(max_length=100, blank=True)
    
    # Manufacturing Details
    manufacture_date = models.DateField()
    expiry_date = models.DateField(db_index=True)
    
    # Quantity Tracking (in base units)
    initial_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0'))]
    )
    current_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Packaging Level (what level was received)
    packaging_level = models.ForeignKey(
        PackagingLevel,
        on_delete=models.PROTECT,
        related_name='batches'
    )
    
    # Quality Control
    STATUS_CHOICES = [
        ('quarantine', 'Quarantine'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('recalled', 'Recalled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='quarantine')
    
    # Quality Certificate
    certificate_of_analysis = models.FileField(upload_to='coa/', blank=True, null=True)
    qc_notes = models.TextField(blank=True)
    
    # Location
    warehouse = models.ForeignKey(
        'warehouse.Warehouse',
        on_delete=models.PROTECT,
        related_name='drug_batches'
    )
    storage_location = models.CharField(max_length=100, blank=True, help_text="e.g., Shelf A-12")
    
    # Serialization & Traceability
    serial_numbers = models.JSONField(
        default=list,
        blank=True,
        help_text="List of serial numbers for track-and-trace compliance"
    )
    
    # Supplier Information
    supplier = models.ForeignKey(
        'procurement.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    purchase_order_number = models.CharField(max_length=100, blank=True)
    
    # Costs
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ('tenant_id', 'drug_product', 'batch_number')
        ordering = ['expiry_date', 'batch_number']
        indexes = [
            models.Index(fields=['tenant_id', 'expiry_date']),
            models.Index(fields=['tenant_id', 'status']),
            models.Index(fields=['drug_product', 'batch_number']),
        ]
        verbose_name_plural = 'Drug Batches'
    
    def __str__(self):
        return f"{self.drug_product.generic_name} - Batch {self.batch_number}"
    
    def is_expired(self):
        """Check if batch is expired"""
        from django.utils import timezone
        return timezone.now().date() > self.expiry_date
    
    def days_until_expiry(self):
        """Calculate days until expiry"""
        from django.utils import timezone
        delta = self.expiry_date - timezone.now().date()
        return delta.days


class DrugDispensing(TenantAwareModel):
    """
    Track dispensing of drugs at any packaging level with partial dispensing support
    """
    drug_product = models.ForeignKey(DrugProduct, on_delete=models.PROTECT, related_name='dispensings')
    batch = models.ForeignKey(DrugBatch, on_delete=models.PROTECT, related_name='dispensings')
    packaging_level = models.ForeignKey(
        PackagingLevel,
        on_delete=models.PROTECT,
        help_text="Packaging level at which drug is dispensed"
    )
    
    # Dispensing Details
    dispensing_number = models.CharField(max_length=100, blank=True, db_index=True)
    quantity_dispensed = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
        help_text="Quantity at the specified packaging level"
    )
    quantity_in_base_units = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text="Automatically calculated quantity in base units"
    )
    
    # Transaction Reference
    sales_order = models.ForeignKey(
        'sales.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='drug_dispensings'
    )
    
    # Customer/Patient Information
    customer = models.ForeignKey(
        'sales.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    patient_name = models.CharField(max_length=200, blank=True)
    prescription_number = models.CharField(max_length=100, blank=True)
    
    # Prescriber Information
    prescriber_name = models.CharField(max_length=200, blank=True)
    prescriber_license = models.CharField(max_length=100, blank=True)
    
    # Dispensing Details
    dispensed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='dispensed_drugs'
    )
    dispensing_date = models.DateTimeField(auto_now_add=True)
    
    # Pricing
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Notes
    dispensing_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-dispensing_date']
        indexes = [
            models.Index(fields=['tenant_id', '-dispensing_date']),
            models.Index(fields=['drug_product', '-dispensing_date']),
            models.Index(fields=['batch']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate dispensing number
        if not self.dispensing_number:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.dispensing_number = get_next_number(tenant, 'dispensing')
        
        # Calculate base units
        self.quantity_in_base_units = self.packaging_level.convert_to_base_units(self.quantity_dispensed)
        
        # Calculate total price
        self.total_price = self.unit_price * self.quantity_dispensed
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Disp-{self.dispensing_number}: {self.drug_product.generic_name} x {self.quantity_dispensed}"


class DrugInventory(TenantAwareModel):
    """
    Current inventory status aggregated across all batches and packaging levels
    """
    drug_product = models.ForeignKey(DrugProduct, on_delete=models.CASCADE, related_name='inventory_status')
    warehouse = models.ForeignKey(
        'warehouse.Warehouse',
        on_delete=models.CASCADE,
        related_name='drug_inventory'
    )
    packaging_level = models.ForeignKey(
        PackagingLevel,
        on_delete=models.CASCADE,
        related_name='inventory_status'
    )
    
    # Stock Levels (at this packaging level)
    quantity_available = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        help_text="Available for sale"
    )
    quantity_reserved = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        help_text="Reserved for orders"
    )
    quantity_quarantine = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        help_text="In quarantine/QC"
    )
    
    # Reorder Management
    reorder_level = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    reorder_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    
    # Last Updated
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('tenant_id', 'drug_product', 'warehouse', 'packaging_level')
        indexes = [
            models.Index(fields=['tenant_id', 'drug_product', 'warehouse']),
        ]
        verbose_name_plural = 'Drug Inventories'
    
    def __str__(self):
        return f"{self.drug_product.generic_name} @ {self.warehouse.name} ({self.packaging_level.level_name})"
    
    @property
    def total_quantity(self):
        """Total quantity (available + reserved + quarantine)"""
        return self.quantity_available + self.quantity_reserved + self.quantity_quarantine
    
    def is_below_reorder_level(self):
        """Check if stock is below reorder level"""
        return self.quantity_available <= self.reorder_level

