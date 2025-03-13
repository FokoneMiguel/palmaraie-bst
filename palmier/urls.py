from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from .views import (
    PlantationViewSet,
    OperationViewSet,
    ProductionViewSet,
    VenteViewSet,
    MouvementCaisseViewSet,
    statistiques_productions
)

router = DefaultRouter()
router.register(r'plantations', PlantationViewSet)
router.register(r'operations', OperationViewSet)
router.register(r'productions', ProductionViewSet)
router.register(r'ventes', VenteViewSet)
router.register(r'mouvements-caisse', MouvementCaisseViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/productions/statistiques/', statistiques_productions, name='statistiques_productions'),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
] 