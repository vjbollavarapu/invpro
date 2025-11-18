# Generated migration to add error_count field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shopify_integration', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='shopifyintegration',
            name='error_count',
            field=models.PositiveIntegerField(default=0, help_text='Number of consecutive errors'),
        ),
    ]
