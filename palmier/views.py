from django.shortcuts import render
from django.db.models import Sum, Avg, Count, F
from django.db.models.functions import ExtractYear, ExtractMonth
from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from .models import Plantation, Operation, Production, Vente, MouvementCaisse
from .serializers import (
    PlantationSerializer,
    OperationSerializer,
    ProductionSerializer,
    VenteSerializer,
    MouvementCaisseSerializer
)

# Create your views here.

class PlantationViewSet(viewsets.ModelViewSet):
    queryset = Plantation.objects.all()
    serializer_class = PlantationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'localisation']
    ordering_fields = ['nom', 'date_plantation', 'superficie', 'nombre_arbres']

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        plantation = self.get_object()
        operations = Operation.objects.filter(plantation=plantation)
        productions = Production.objects.filter(plantation=plantation)
        ventes = Vente.objects.filter(production__plantation=plantation)
        
        stats = {
            'total_cout_operations': operations.aggregate(total=Sum('cout'))['total'] or 0,
            'total_production': productions.aggregate(total=Sum('poids_total'))['total'] or 0,
            'nombre_operations': operations.count(),
            'nombre_productions': productions.count(),
            'rendement_moyen': (productions.aggregate(avg=Avg('poids_total'))['avg'] or 0) / plantation.nombre_arbres,
            'chiffre_affaires': ventes.aggregate(total=Sum('montant_total'))['total'] or 0,
            'qualite_productions': {
                qualite: productions.filter(qualite=qualite).count()
                for qualite, _ in Production.QUALITE_CHOICES
            }
        }
        
        return Response(stats)

class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    serializer_class = OperationSerializer
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plantation', 'type_operation']
    ordering_fields = ['date', 'cout']

    @action(detail=False, methods=['get'])
    def statistiques_mensuelles(self, request):
        annee = request.query_params.get('annee', None)
        queryset = self.get_queryset()
        
        if annee:
            queryset = queryset.filter(date__year=annee)
        
        stats = queryset.annotate(
            mois=ExtractMonth('date'),
            annee=ExtractYear('date')
        ).values('annee', 'mois', 'type_operation').annotate(
            total_cout=Sum('cout'),
            nombre_operations=Count('id')
        ).order_by('annee', 'mois', 'type_operation')
        
        return Response(stats)

class ProductionViewSet(viewsets.ModelViewSet):
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plantation', 'qualite']
    ordering_fields = ['date_recolte', 'poids_total', 'stock_disponible']

    @action(detail=False, methods=['get'], url_path='statistiques')
    def statistiques_globales(self, request):
        queryset = self.get_queryset()
        stats = {
            'total_poids': queryset.aggregate(total=Sum('poids_total'))['total'] or 0,
            'total_regimes': queryset.aggregate(total=Sum('quantite'))['total'] or 0,
            'stock_total_disponible': queryset.aggregate(total=Sum('stock_disponible'))['total'] or 0,
            'moyenne_par_recolte': queryset.aggregate(avg=Avg('poids_total'))['avg'] or 0,
            'repartition_qualite': {
                qualite: queryset.filter(qualite=qualite).count()
                for qualite, _ in Production.QUALITE_CHOICES
            },
            'stock_par_qualite': {
                qualite: queryset.filter(qualite=qualite).aggregate(total=Sum('stock_disponible'))['total'] or 0
                for qualite, _ in Production.QUALITE_CHOICES
            },
            'evolution_mensuelle': queryset.annotate(
                mois=ExtractMonth('date_recolte'),
                annee=ExtractYear('date_recolte')
            ).values('annee', 'mois').annotate(
                total_production=Sum('poids_total'),
                stock_disponible=Sum('stock_disponible'),
                nombre_recoltes=Count('id')
            ).order_by('annee', 'mois'),
            'productions_faible_stock': queryset.filter(
                stock_disponible__lt=F('poids_total') * 0.2  # Moins de 20% de stock
            ).values('plantation__nom', 'date_recolte', 'stock_disponible', 'poids_total')
        }
        return Response(stats)

    @action(detail=False, methods=['get'])
    def alertes_stock(self, request):
        seuil = float(request.query_params.get('seuil', 20))  # Seuil en pourcentage
        alertes = self.get_queryset().annotate(
            pourcentage_stock=F('stock_disponible') * 100.0 / F('poids_total')
        ).filter(
            pourcentage_stock__lt=seuil,
            stock_disponible__gt=0  # Exclure les stocks épuisés
        ).values(
            'plantation__nom',
            'date_recolte',
            'qualite',
            'stock_disponible',
            'poids_total'
        ).annotate(
            pourcentage=F('pourcentage_stock')
        )
        return Response(alertes)

class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.all()
    serializer_class = VenteSerializer
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['production__plantation', 'client']
    ordering_fields = ['date_vente', 'montant_total']

    @action(detail=False, methods=['get'])
    def statistiques_ventes(self, request):
        stats = {
            'chiffre_affaires_total': self.get_queryset().aggregate(
                total=Sum('montant_total')
            )['total'] or 0,
            'prix_moyen_kg': self.get_queryset().aggregate(
                prix_moyen=Sum('montant_total') / Sum('quantite')
            )['prix_moyen'] or 0,
            'evolution_mensuelle': self.get_queryset().annotate(
                mois=ExtractMonth('date_vente'),
                annee=ExtractYear('date_vente')
            ).values('annee', 'mois').annotate(
                chiffre_affaires=Sum('montant_total'),
                quantite_vendue=Sum('quantite')
            ).order_by('annee', 'mois'),
            'top_clients': self.get_queryset().values('client').annotate(
                total_achats=Sum('montant_total'),
                nombre_achats=Count('id'),
                quantite_totale=Sum('quantite')
            ).order_by('-total_achats')[:5],
            'repartition_stock': Production.objects.annotate(
                pourcentage_stock=F('stock_disponible') * 100.0 / F('poids_total')
            ).values('plantation__nom').annotate(
                stock_total=Sum('stock_disponible'),
                production_totale=Sum('poids_total'),
                pourcentage_moyen=Avg('pourcentage_stock')
            )
        }
        return Response(stats)

class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all()
    serializer_class = MouvementCaisseSerializer
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type_mouvement']
    ordering_fields = ['date', 'montant']

    @action(detail=False, methods=['get'])
    def bilan(self, request):
        queryset = self.get_queryset()
        date_debut = request.query_params.get('date_debut', None)
        date_fin = request.query_params.get('date_fin', None)

        if date_debut:
            queryset = queryset.filter(date__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date__lte=date_fin)

        entrees = queryset.filter(type_mouvement='ENTREE')
        sorties = queryset.filter(type_mouvement='SORTIE')
        
        total_entrees = entrees.aggregate(total=Sum('montant'))['total'] or 0
        total_sorties = sorties.aggregate(total=Sum('montant'))['total'] or 0
        
        stats = {
            'total_entrees': total_entrees,
            'total_sorties': total_sorties,
            'solde': total_entrees - total_sorties,
            'evolution_mensuelle': queryset.annotate(
                mois=ExtractMonth('date'),
                annee=ExtractYear('date')
            ).values('annee', 'mois', 'type_mouvement').annotate(
                total=Sum('montant'),
                nombre=Count('id')
            ).order_by('annee', 'mois', 'type_mouvement')
        }
        
        return Response(stats)

@api_view(['GET'])
def statistiques_productions(request):
    total_poids = Production.objects.aggregate(total=Sum('poids_total'))['total'] or 0
    total_regimes = Production.objects.aggregate(total=Sum('quantite'))['total'] or 0
    
    return Response({
        'total_poids': total_poids,
        'total_regimes': total_regimes
    })
