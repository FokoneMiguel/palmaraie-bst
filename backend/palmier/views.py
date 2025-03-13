from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets
from .models import Vente, MouvementCaisse
from .serializers import VenteSerializer, MouvementCaisseSerializer

class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.all()
    serializer_class = VenteSerializer

    @action(detail=False, methods=['get'])
    def chiffre_affaires(self, request):
        total = Vente.objects.aggregate(total=Sum('montant_total'))
        return Response({'chiffre_affaires': total['total'] or 0})

class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all()
    serializer_class = MouvementCaisseSerializer

    @action(detail=False, methods=['get'])
    def bilan(self, request):
        entrees = MouvementCaisse.objects.filter(type_mouvement='ENTREE').aggregate(total=Sum('montant'))
        sorties = MouvementCaisse.objects.filter(type_mouvement='SORTIE').aggregate(total=Sum('montant'))
        
        total_entrees = entrees['total'] or 0
        total_sorties = sorties['total'] or 0
        solde = total_entrees - total_sorties

        return Response({
            'total_entrees': total_entrees,
            'total_sorties': total_sorties,
            'solde': solde
        }) 