# Generated by Django 5.1.7 on 2025-03-09 08:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='MouvementCaisse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('type_mouvement', models.CharField(choices=[('ENTREE', 'Entrée'), ('SORTIE', 'Sortie')], max_length=10)),
                ('montant', models.DecimalField(decimal_places=2, max_digits=12)),
                ('description', models.TextField()),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='Plantation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=255)),
                ('superficie', models.DecimalField(decimal_places=2, max_digits=10)),
                ('date_plantation', models.DateField()),
                ('nombre_arbres', models.IntegerField()),
                ('localisation', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
            ],
            options={
                'ordering': ['nom'],
            },
        ),
        migrations.CreateModel(
            name='Operation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_operation', models.CharField(choices=[('ENTRETIEN', 'Entretien'), ('TRAITEMENT', 'Traitement'), ('FERTILISATION', 'Fertilisation'), ('AUTRE', 'Autre')], max_length=20)),
                ('date', models.DateField()),
                ('cout', models.DecimalField(decimal_places=2, max_digits=10)),
                ('description', models.TextField()),
                ('plantation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='operations', to='palmier.plantation')),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='Production',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_recolte', models.DateField()),
                ('quantite', models.IntegerField()),
                ('poids_total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('qualite', models.CharField(choices=[('A', 'Excellente'), ('B', 'Bonne'), ('C', 'Moyenne'), ('D', 'Faible')], max_length=1)),
                ('plantation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='productions', to='palmier.plantation')),
            ],
            options={
                'ordering': ['-date_recolte'],
            },
        ),
        migrations.CreateModel(
            name='Vente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_vente', models.DateField()),
                ('client', models.CharField(max_length=255)),
                ('quantite', models.DecimalField(decimal_places=2, max_digits=10)),
                ('prix_unitaire', models.DecimalField(decimal_places=2, max_digits=10)),
                ('montant_total', models.DecimalField(decimal_places=2, max_digits=12)),
                ('production', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ventes', to='palmier.production')),
            ],
            options={
                'ordering': ['-date_vente'],
            },
        ),
    ]
