<template>
    <div class="chat-page">
        <div class="chat-container">
            <!-- Left Sidebar: Conversation List -->
            <ChatSidebar
                :conversations="conversations"
                :active-conversation-id="activeConversationId"
                :current-user-id="currentUserId"
                @select="handleSelectConversation"
                @create="handleCreateConversation"
            />

            <!-- Middle: Chat Window -->
            <ChatWindow
                :conversation="activeConversation"
                :messages="messages"
                :current-user-id="currentUserId"
                @send="handleSendMessage"
            />

            <!-- Right: Details Panel -->
            <ChatDetailsPanel
                :conversation="activeConversation"
                :current-user-id="currentUserId"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatWindow from '@/components/chat/ChatWindow.vue'
import ChatDetailsPanel from '@/components/chat/ChatDetailsPanel.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const currentUserId = computed(() => authStore.user?.id)
const conversations = computed(() => chatStore.conversations)
const activeConversationId = ref(null)

const activeConversation = computed(() => {
    if (!activeConversationId.value) return null
    return conversations.value.find(c => c.id === activeConversationId.value) || null
})

const messages = computed(() => {
    if (!activeConversationId.value) return []
    return chatStore.getMessages(activeConversationId.value) || []
})

const handleSelectConversation = (conversationId) => {
    activeConversationId.value = conversationId
    chatStore.loadMessages(conversationId)
}

const handleCreateConversation = () => {
    // TODO: Implement create conversation modal
}

const handleSendMessage = async (content) => {
    if (!activeConversationId.value) return
    const tempId = `temp-${Date.now()}`
    try {
        chatStore.addPendingMessage(activeConversationId.value, tempId, {
            conversationId: activeConversationId.value,
            senderId: currentUserId.value,
            senderName: authStore.user?.fullName || 'You',
            content,
            contentType: 'TEXT',
            status: 'SENT'
        })
        const message = await chatMessages.sendTextMessage(activeConversationId.value, content)
        chatStore.resolvePendingMessage(activeConversationId.value, tempId, message)
    } catch (error) {
        // Failed to send message, error handled by store
        chatStore.failPendingMessage(activeConversationId.value, tempId, error)
    }
}

onMounted(async () => {
    await chatStore.loadConversations()
})

onBeforeUnmount(() => {
    chatStore.disconnect()
})
</script>

<style scoped>
.chat-page {
    width: 100%;
    height: 100vh;
    display: flex;
    background: #f0f2f5;
}

.chat-container {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 360px 1fr 320px;
    height: 100vh;
    background: #ffffff;
}
</style>

