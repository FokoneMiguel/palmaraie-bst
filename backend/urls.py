from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plantations', views.PlantationViewSet)
router.register(r'operations', views.OperationViewSet)
router.register(r'productions', views.ProductionViewSet)
router.register(r'ventes', views.VenteViewSet)
router.register(r'mouvements-caisse', views.MouvementCaisseViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
] 