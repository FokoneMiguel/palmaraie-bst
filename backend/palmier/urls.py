from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenteViewSet, MouvementCaisseViewSet

router = DefaultRouter()
router.register(r'ventes', VenteViewSet)
router.register(r'mouvements-caisse', MouvementCaisseViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
] 