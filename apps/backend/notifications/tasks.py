from celery import shared_task
from django.core.mail import send_mail, send_mass_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from inventory.models import Product
from sales.models import Order
from notifications.models import Notification
from tenants.models import Tenant, Membership
from users.models import User


@shared_task
def send_low_stock_alert(product_id, tenant_id):
    """Send low stock alert email for a specific product"""
    try:
        product = Product.objects.get(id=product_id, tenant_id=tenant_id)
        tenant = product.tenant
        
        # Get admin users for this tenant
        admin_memberships = Membership.objects.filter(
            tenant=tenant,
            role__in=['admin', 'manager'],
            is_active=True
        )
        
        admin_emails = [m.user.email for m in admin_memberships if m.user.email]
        
        if not admin_emails:
            return
        
        subject = f'Low Stock Alert: {product.name}'
        message = f"""
Dear Team,

This is an automated alert to inform you that the following product is running low on stock:

Product: {product.name}
SKU: {product.sku}
Current Stock: {product.quantity} {product.unit}
Reorder Level: {product.reorder_level} {product.unit}
Warehouse: {product.warehouse.name if product.warehouse else 'N/A'}

Please consider creating a purchase order to restock this item.

---
InvPro360 Inventory Management System
{tenant.name}
"""
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails,
            fail_silently=True,
        )
        
        # Create notification
        for membership in admin_memberships:
            Notification.objects.create(
                tenant=tenant,
                user=membership.user,
                title=f'Low Stock: {product.name}',
                message=f'Current stock: {product.quantity} {product.unit}. Reorder level: {product.reorder_level} {product.unit}',
                notification_type='warning',
                link=f'/dashboard/inventory',
            )
        
        return f"Low stock alert sent for {product.name}"
    except Exception as e:
        return f"Error sending low stock alert: {str(e)}"


@shared_task
def send_order_confirmation(order_id):
    """Send order confirmation email"""
    try:
        order = Order.objects.get(id=order_id)
        customer = order.customer
        
        if not customer.email:
            return "Customer has no email"
        
        subject = f'Order Confirmation - {order.order_number}'
        message = f"""
Dear {customer.name},

Thank you for your order! Here are your order details:

Order Number: {order.order_number}
Order Date: {order.order_date.strftime('%Y-%m-%d')}
Status: {order.get_status_display()}
Total Amount: ${order.total_amount}

Your order is being processed and you will receive updates via email.

---
InvPro360 Inventory Management System
"""
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [customer.email],
            fail_silently=True,
        )
        
        return f"Order confirmation sent for {order.order_number}"
    except Exception as e:
        return f"Error sending order confirmation: {str(e)}"


@shared_task
def check_low_stock_alerts():
    """Daily task to check all low stock items across all tenants"""
    products_checked = 0
    alerts_sent = 0
    
    for tenant in Tenant.objects.filter(is_active=True):
        # Find products at or below reorder level
        low_stock_products = Product.objects.filter(
            tenant=tenant,
            quantity__lte=models.F('reorder_level'),
            quantity__gt=0,
            status='active'
        )
        
        for product in low_stock_products:
            send_low_stock_alert.delay(product.id, tenant.id)
            alerts_sent += 1
            products_checked += 1
    
    return f"Checked {products_checked} products, sent {alerts_sent} alerts"


@shared_task
def send_daily_summary(tenant_id=None):
    """Send daily business summary to admins"""
    tenants = [Tenant.objects.get(id=tenant_id)] if tenant_id else Tenant.objects.filter(is_active=True)
    
    for tenant in tenants:
        admin_memberships = Membership.objects.filter(
            tenant=tenant,
            role='admin',
            is_active=True
        )
        
        admin_emails = [m.user.email for m in admin_memberships if m.user.email]
        
        if not admin_emails:
            continue
        
        # Gather statistics
        total_products = Product.objects.filter(tenant=tenant).count()
        low_stock = Product.objects.filter(
            tenant=tenant,
            quantity__lte=models.F('reorder_level'),
            status='active'
        ).count()
        
        # Recent orders (last 24 hours)
        yesterday = timezone.now() - timedelta(days=1)
        recent_orders = Order.objects.filter(
            tenant=tenant,
            created_at__gte=yesterday
        )
        
        subject = f'Daily Summary - {tenant.name}'
        message = f"""
Daily Business Summary for {tenant.name}
Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}

INVENTORY:
- Total Products: {total_products}
- Low Stock Items: {low_stock}

SALES (Last 24 hours):
- New Orders: {recent_orders.count()}
- Total Revenue: ${sum(o.total_amount for o in recent_orders)}

---
InvPro360 Inventory Management System
"""
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails,
            fail_silently=True,
        )
    
    return f"Daily summary sent to {len(tenants)} tenants"


@shared_task
def cleanup_old_notifications():
    """Clean up read notifications older than 30 days"""
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        created_at__lt=cutoff_date
    ).delete()
    
    return f"Cleaned up {deleted_count} old notifications"


# Import models here to avoid circular imports
from django.db import models

