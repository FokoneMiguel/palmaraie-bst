from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlantationViewSet,
    OperationViewSet,
    ProductionViewSet,
    VenteViewSet,
    MouvementCaisseViewSet,
)

router = DefaultRouter()
router.register(r'plantations', PlantationViewSet)
router.register(r'operations', OperationViewSet)
router.register(r'productions', ProductionViewSet)
router.register(r'ventes', VenteViewSet)
router.register(r'mouvements-caisse', MouvementCaisseViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 