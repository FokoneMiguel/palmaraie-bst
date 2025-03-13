from django.contrib import admin
from .models import Plantation, Operation, Production, Vente, MouvementCaisse

@admin.register(Plantation)
class PlantationAdmin(admin.ModelAdmin):
    list_display = ('nom', 'superficie', 'date_creation')
    search_fields = ('nom',)
    list_filter = ('date_creation',)

@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ('type_operation', 'plantation', 'date', 'cout', 'operateur')
    list_filter = ('type_operation', 'date', 'plantation')
    search_fields = ('description',)
    date_hierarchy = 'date'

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ('plantation', 'date_recolte', 'quantite_regimes', 'poids_total', 'qualite')
    list_filter = ('date_recolte', 'qualite', 'plantation')
    date_hierarchy = 'date_recolte'

@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = ('client', 'date_vente', 'quantite', 'prix_unitaire', 'montant_total')
    list_filter = ('date_vente',)
    search_fields = ('client',)
    date_hierarchy = 'date_vente'

@admin.register(MouvementCaisse)
class MouvementCaisseAdmin(admin.ModelAdmin):
    list_display = ('date', 'type_mouvement', 'montant', 'description')
    list_filter = ('type_mouvement', 'date')
    search_fields = ('description',)
    date_hierarchy = 'date'
