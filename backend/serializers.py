from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Plantation, Operation, Production, Vente, MouvementCaisse

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class PlantationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plantation
        fields = '__all__'

class OperationSerializer(serializers.ModelSerializer):
    operateur_details = UserSerializer(source='operateur', read_only=True)
    
    class Meta:
        model = Operation
        fields = ['id', 'plantation', 'type_operation', 'date', 'description', 
                 'cout', 'operateur', 'operateur_details']

class ProductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Production
        fields = '__all__'

class VenteSerializer(serializers.ModelSerializer):
    montant_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Vente
        fields = ['id', 'production', 'date_vente', 'client', 'quantite', 
                 'prix_unitaire', 'montant_total']

class MouvementCaisseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MouvementCaisse
        fields = '__all__' 