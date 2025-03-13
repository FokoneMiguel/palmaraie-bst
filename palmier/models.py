from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from datetime import date

# Create your models here.

class Plantation(models.Model):
    nom = models.CharField(max_length=255, unique=True)
    superficie = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    date_plantation = models.DateField()
    nombre_arbres = models.IntegerField(validators=[MinValueValidator(1)])
    localisation = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Plantation'
        verbose_name_plural = 'Plantations'

    def __str__(self):
        return f"{self.nom} ({self.nombre_arbres} arbres)"

    def clean(self):
        if self.date_plantation > date.today():
            raise ValidationError("La date de plantation ne peut pas être dans le futur")

class Operation(models.Model):
    TYPE_CHOICES = [
        ('ENTRETIEN', 'Entretien'),
        ('TRAITEMENT', 'Traitement'),
        ('FERTILISATION', 'Fertilisation'),
        ('AUTRE', 'Autre'),
    ]

    plantation = models.ForeignKey(
        Plantation, 
        on_delete=models.CASCADE, 
        related_name='operations'
    )
    type_operation = models.CharField(max_length=20, choices=TYPE_CHOICES)
    date = models.DateField()
    cout = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    description = models.TextField()

    class Meta:
        ordering = ['-date']
        verbose_name = 'Opération'
        verbose_name_plural = 'Opérations'

    def __str__(self):
        return f"{self.get_type_operation_display()} - {self.plantation.nom} ({self.date})"

    def clean(self):
        if self.date > date.today():
            raise ValidationError("La date de l'opération ne peut pas être dans le futur")

class Production(models.Model):
    QUALITE_CHOICES = [
        ('A', 'Excellente'),
        ('B', 'Bonne'),
        ('C', 'Moyenne'),
        ('D', 'Faible'),
    ]

    plantation = models.ForeignKey(
        Plantation, 
        on_delete=models.CASCADE, 
        related_name='productions'
    )
    date_recolte = models.DateField()
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    poids_total = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    stock_disponible = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    qualite = models.CharField(max_length=1, choices=QUALITE_CHOICES)

    class Meta:
        ordering = ['-date_recolte']
        verbose_name = 'Production'
        verbose_name_plural = 'Productions'

    def __str__(self):
        return f"Production {self.plantation.nom} - {self.date_recolte} ({self.poids_total}kg, stock: {self.stock_disponible}kg)"

    def clean(self):
        if self.date_recolte > date.today():
            raise ValidationError("La date de récolte ne peut pas être dans le futur")

    def save(self, *args, **kwargs):
        if not self.id:  # Nouvelle production
            self.stock_disponible = self.poids_total
        super().save(*args, **kwargs)

class Vente(models.Model):
    production = models.ForeignKey(
        Production, 
        on_delete=models.CASCADE, 
        related_name='ventes'
    )
    date_vente = models.DateField()
    client = models.CharField(max_length=255)
    quantite = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    prix_unitaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    montant_total = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        editable=False
    )

    class Meta:
        ordering = ['-date_vente']
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'

    def __str__(self):
        return f"Vente à {self.client} - {self.date_vente} ({self.montant_total}€)"

    def clean(self):
        if self.date_vente > date.today():
            raise ValidationError("La date de vente ne peut pas être dans le futur")
        if hasattr(self, 'production'):
            if self.quantite > self.production.stock_disponible:
                raise ValidationError("La quantité vendue ne peut pas dépasser le stock disponible")

    def save(self, *args, **kwargs):
        # Calcul du montant total avec arrondi à 2 décimales
        self.montant_total = round(self.quantite * self.prix_unitaire, 2)
        self.full_clean()
        
        # Mise à jour du stock
        if self.id:
            # Si c'est une modification, on restaure d'abord l'ancien stock
            ancien_vente = Vente.objects.get(id=self.id)
            self.production.stock_disponible += ancien_vente.quantite
            
        # On soustrait la nouvelle quantité
        self.production.stock_disponible -= self.quantite
        self.production.save()
        
        super().save(*args, **kwargs)

class MouvementCaisse(models.Model):
    TYPE_CHOICES = [
        ('ENTREE', 'Entrée'),
        ('SORTIE', 'Sortie'),
    ]

    date = models.DateField()
    type_mouvement = models.CharField(max_length=10, choices=TYPE_CHOICES)
    montant = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    description = models.TextField()

    class Meta:
        ordering = ['-date']
        verbose_name = 'Mouvement de caisse'
        verbose_name_plural = 'Mouvements de caisse'

    def __str__(self):
        return f"{self.get_type_mouvement_display()} - {self.date} ({self.montant}€)"

    def clean(self):
        if self.date > date.today():
            raise ValidationError("La date du mouvement ne peut pas être dans le futur")
