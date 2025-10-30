from django.urls import path
from . import views

app_name = 'messaging_app'

urlpatterns = [
    # B-MSG-01: Conversation List
    path('conversations/', views.ConversationListView.as_view(), name='conversations'),

    # B-MSG-02: Message Requests
    path('requests/', views.MessageRequestsView.as_view(), name='message-requests'),

    # B-MSG-03: Message History (GET) & B-MSG-04: Send Message (POST)
    path('chat/<str:username>/', views.ChatView.as_view(), name='chat'),

    # B-MSG-08: Fetch Messages in Thread
    path('conversations/<int:conversation_id>/messages/', views.ConversationMessagesView.as_view(), name='conversation-messages'),

    # B-MSG-12: Send New Message
    path('send/', views.SendMessageView.as_view(), name='send-message'),
]