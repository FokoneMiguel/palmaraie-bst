from django.core.management.base import BaseCommand
from django.utils import timezone
from palmier.models import Plantation, Operation, Production, Vente, MouvementCaisse
from decimal import Decimal
from datetime import timedelta

class Command(BaseCommand):
    help = 'Charge des données de test dans la base de données'

    def handle(self, *args, **options):
        # Nettoyage des données existantes
        self.stdout.write('Nettoyage des données existantes...')
        MouvementCaisse.objects.all().delete()
        Vente.objects.all().delete()
        Production.objects.all().delete()
        Operation.objects.all().delete()
        Plantation.objects.all().delete()

        # Création des plantations
        self.stdout.write('Création des plantations...')
        plantations = [
            Plantation.objects.create(
                nom='Plantation Nord',
                superficie=Decimal('100.00'),
                date_plantation=timezone.now().date() - timedelta(days=365),
                nombre_arbres=500,
                localisation='Zone Nord',
                description='Plantation principale de palmiers'
            ),
            Plantation.objects.create(
                nom='Plantation Sud',
                superficie=Decimal('75.50'),
                date_plantation=timezone.now().date() - timedelta(days=180),
                nombre_arbres=350,
                localisation='Zone Sud',
                description='Nouvelle plantation en développement'
            )
        ]

        # Création des opérations
        self.stdout.write('Création des opérations...')
        for plantation in plantations:
            Operation.objects.create(
                plantation=plantation,
                type_operation='ENTRETIEN',
                date=timezone.now().date() - timedelta(days=30),
                cout=Decimal('1500.00'),
                description='Entretien mensuel'
            )
            Operation.objects.create(
                plantation=plantation,
                type_operation='FERTILISATION',
                date=timezone.now().date() - timedelta(days=15),
                cout=Decimal('2500.00'),
                description='Fertilisation trimestrielle'
            )

        # Création des productions
        self.stdout.write('Création des productions...')
        for plantation in plantations:
            production = Production.objects.create(
                plantation=plantation,
                date_recolte=timezone.now().date() - timedelta(days=7),
                quantite=100,
                poids_total=Decimal('1000.00'),
                qualite='A'
            )
            
            # Création des ventes
            self.stdout.write('Création des ventes...')
            Vente.objects.create(
                production=production,
                date_vente=timezone.now().date() - timedelta(days=5),
                client='Client A',
                quantite=Decimal('500.00'),
                prix_unitaire=Decimal('2.50')
            )

        # Création des mouvements de caisse
        self.stdout.write('Création des mouvements de caisse...')
        MouvementCaisse.objects.create(
            date=timezone.now().date() - timedelta(days=5),
            type_mouvement='ENTREE',
            montant=Decimal('1250.00'),
            description='Vente de production'
        )
        MouvementCaisse.objects.create(
            date=timezone.now().date() - timedelta(days=2),
            type_mouvement='SORTIE',
            montant=Decimal('800.00'),
            description='Paiement des opérations'
        )

        self.stdout.write(self.style.SUCCESS('Données de test chargées avec succès!')) 