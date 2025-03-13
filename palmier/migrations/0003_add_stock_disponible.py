from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('palmier', '0002_alter_mouvementcaisse_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='production',
            name='stock_disponible',
            field=models.DecimalField(
                default=0,
                max_digits=10,
                decimal_places=2,
            ),
        ),
    ] 