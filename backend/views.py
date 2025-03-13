from django.shortcuts import render
from rest_framework import viewsets, permissions
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Plantation, Operation, Production, Vente, MouvementCaisse
from .serializers import (PlantationSerializer, OperationSerializer, 
                        ProductionSerializer, VenteSerializer, MouvementCaisseSerializer)

# Create your views here.

class PlantationViewSet(viewsets.ModelViewSet):
    queryset = Plantation.objects.all()
    serializer_class = PlantationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True)
    def statistiques(self, request, pk=None):
        plantation = self.get_object()
        operations = Operation.objects.filter(plantation=plantation)
        productions = Production.objects.filter(plantation=plantation)
        
        total_cout = operations.aggregate(Sum('cout'))['cout__sum'] or 0
        total_production = productions.aggregate(Sum('poids_total'))['poids_total__sum'] or 0
        
        return Response({
            'total_cout': total_cout,
            'total_production': total_production,
            'nombre_operations': operations.count(),
            'nombre_productions': productions.count(),
        })

class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    serializer_class = OperationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Operation.objects.all()
        plantation_id = self.request.query_params.get('plantation', None)
        if plantation_id:
            queryset = queryset.filter(plantation_id=plantation_id)
        return queryset

class ProductionViewSet(viewsets.ModelViewSet):
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False)
    def statistiques_globales(self, request):
        total_production = Production.objects.aggregate(
            total_poids=Sum('poids_total'),
            total_regimes=Sum('quantite_regimes')
        )
        return Response(total_production)

class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.all()
    serializer_class = VenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False)
    def chiffre_affaires(self, request):
        total = Vente.objects.aggregate(
            total=Sum('quantite' * 'prix_unitaire')
        )['total'] or 0
        return Response({'chiffre_affaires': total})

class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all()
    serializer_class = MouvementCaisseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False)
    def bilan(self, request):
        entrees = MouvementCaisse.objects.filter(type_mouvement='ENTREE').aggregate(
            total=Sum('montant'))['total'] or 0
        sorties = MouvementCaisse.objects.filter(type_mouvement='SORTIE').aggregate(
            total=Sum('montant'))['total'] or 0
        
        return Response({
            'total_entrees': entrees,
            'total_sorties': sorties,
            'solde': entrees - sorties
        })
