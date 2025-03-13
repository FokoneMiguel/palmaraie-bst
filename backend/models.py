from django.db import models
from django.contrib.auth.models import User

class Plantation(models.Model):
    nom = models.CharField(max_length=100)
    superficie = models.DecimalField(max_digits=10, decimal_places=2)
    date_creation = models.DateField()
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.nom

class Operation(models.Model):
    TYPES_OPERATION = [
        ('ABATTAGE', 'Abattage'),
        ('DEFRICHAGE', 'Défrichage'),
        ('PIQUETAGE', 'Piquetage'),
        ('PLANTATION', 'Plantation'),
        ('ENTRETIEN', 'Entretien'),
        ('RECOLTE', 'Récolte'),
    ]
    
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE)
    type_operation = models.CharField(max_length=20, choices=TYPES_OPERATION)
    date = models.DateField()
    description = models.TextField()
    cout = models.DecimalField(max_digits=10, decimal_places=2)
    operateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.get_type_operation_display()} - {self.date}"

class Production(models.Model):
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE)
    date_recolte = models.DateField()
    quantite_regimes = models.IntegerField()
    poids_total = models.DecimalField(max_digits=10, decimal_places=2)
    qualite = models.CharField(max_length=50)
    
    def __str__(self):
        return f"Récolte du {self.date_recolte} - {self.poids_total}kg"

class Vente(models.Model):
    production = models.ForeignKey(Production, on_delete=models.CASCADE)
    date_vente = models.DateField()
    client = models.CharField(max_length=100)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    
    @property
    def montant_total(self):
        return self.quantite * self.prix_unitaire
    
    def __str__(self):
        return f"Vente à {self.client} le {self.date_vente}"

class MouvementCaisse(models.Model):
    TYPES_MOUVEMENT = [
        ('ENTREE', 'Entrée'),
        ('SORTIE', 'Sortie'),
    ]
    
    date = models.DateField()
    type_mouvement = models.CharField(max_length=10, choices=TYPES_MOUVEMENT)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    vente = models.ForeignKey(Vente, on_delete=models.SET_NULL, null=True, blank=True)
    operation = models.ForeignKey(Operation, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.get_type_mouvement_display()} - {self.montant}€ - {self.date}"
