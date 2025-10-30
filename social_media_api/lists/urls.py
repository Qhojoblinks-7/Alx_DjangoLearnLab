from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ListViewSet, DefaultListsView

app_name = 'lists'

router = DefaultRouter()
router.register(r'lists', ListViewSet, basename='list')

urlpatterns = [
    path('', include(router.urls)),
    path('defaults/', DefaultListsView.as_view({'get': 'list'}), name='default-lists'),
    path('defaults/initialize/', DefaultListsView.as_view({'post': 'initialize_defaults'}), name='initialize-defaults'),
]