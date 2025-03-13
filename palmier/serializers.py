from rest_framework import serializers
from .models import Plantation, Operation, Production, Vente, MouvementCaisse

class PlantationSerializer(serializers.ModelSerializer):
    nombre_operations = serializers.IntegerField(read_only=True)
    nombre_productions = serializers.IntegerField(read_only=True)
    rendement_moyen = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Plantation
        fields = [
            'id', 'nom', 'superficie', 'date_plantation', 
            'nombre_arbres', 'localisation', 'description',
            'nombre_operations', 'nombre_productions', 'rendement_moyen'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['nombre_operations'] = instance.operations.count()
        data['nombre_productions'] = instance.productions.count()
        productions = instance.productions.all()
        if productions:
            total_poids = sum(p.poids_total for p in productions)
            data['rendement_moyen'] = total_poids / len(productions)
        else:
            data['rendement_moyen'] = 0
        return data

class OperationSerializer(serializers.ModelSerializer):
    plantation_nom = serializers.CharField(source='plantation.nom', read_only=True)
    type_operation_display = serializers.CharField(source='get_type_operation_display', read_only=True)

    class Meta:
        model = Operation
        fields = [
            'id', 'plantation', 'plantation_nom', 
            'type_operation', 'type_operation_display',
            'date', 'cout', 'description'
        ]

class ProductionSerializer(serializers.ModelSerializer):
    plantation_nom = serializers.CharField(source='plantation.nom', read_only=True)
    qualite_display = serializers.CharField(source='get_qualite_display', read_only=True)
    rendement_par_arbre = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    pourcentage_stock = serializers.SerializerMethodField()

    class Meta:
        model = Production
        fields = [
            'id', 'plantation', 'plantation_nom',
            'date_recolte', 'quantite', 'poids_total',
            'stock_disponible', 'pourcentage_stock',
            'qualite', 'qualite_display', 'rendement_par_arbre'
        ]

    def get_pourcentage_stock(self, obj):
        if obj.poids_total > 0:
            return (obj.stock_disponible / obj.poids_total) * 100
        return 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.plantation.nombre_arbres > 0:
            data['rendement_par_arbre'] = instance.poids_total / instance.plantation.nombre_arbres
        else:
            data['rendement_par_arbre'] = 0
        return data

class VenteSerializer(serializers.ModelSerializer):
    production_details = ProductionSerializer(source='production', read_only=True)
    prix_moyen_kg = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_restant = serializers.DecimalField(source='production.stock_disponible', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Vente
        fields = [
            'id', 'production', 'production_details',
            'date_vente', 'client', 'quantite',
            'prix_unitaire', 'montant_total', 
            'prix_moyen_kg', 'stock_restant'
        ]
        read_only_fields = ['montant_total']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.quantite > 0:
            data['prix_moyen_kg'] = instance.montant_total / instance.quantite
        else:
            data['prix_moyen_kg'] = 0
        return data

    def validate(self, data):
        if 'production' in data and 'quantite' in data:
            if data['quantite'] > data['production'].stock_disponible:
                raise serializers.ValidationError(
                    "La quantité vendue ne peut pas dépasser le stock disponible"
                )
        return data

class MouvementCaisseSerializer(serializers.ModelSerializer):
    type_mouvement_display = serializers.CharField(source='get_type_mouvement_display', read_only=True)

    class Meta:
        model = MouvementCaisse
        fields = [
            'id', 'date', 'type_mouvement', 
            'type_mouvement_display', 'montant', 
            'description'
        ]

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le montant doit être supérieur à 0"
            )
        return value 