<template>
    <div class="emoji-picker" v-if="show" @click.stop>
        <div class="emoji-picker__header">
            <div class="emoji-picker__tabs">
                <button
                    v-for="category in categories"
                    :key="category.name"
                    class="emoji-picker__tab"
                    :class="{ 'emoji-picker__tab--active': activeCategory === category.name }"
                    @click="activeCategory = category.name"
                    :title="category.label"
                >
                    <i :class="category.icon"></i>
                </button>
            </div>
        </div>
        <div class="emoji-picker__body">
            <div
                v-for="category in categories"
                :key="category.name"
                v-show="activeCategory === category.name"
                class="emoji-picker__category"
            >
                <div class="emoji-picker__category-title">{{ category.label }}</div>
                <div class="emoji-picker__grid">
                    <button
                        v-for="emoji in category.emojis"
                        :key="emoji"
                        class="emoji-picker__item"
                        @click="selectEmoji(emoji)"
                        :title="emoji"
                    >
                        {{ emoji }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['select', 'close'])

const activeCategory = ref('smileys')

const categories = [
    {
        name: 'smileys',
        label: 'Cảm xúc',
        icon: 'bi bi-emoji-smile',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
    },
    {
        name: 'gestures',
        label: 'Cử chỉ',
        icon: 'bi bi-hand-thumbs-up',
        emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄']
    },
    {
        name: 'hearts',
        label: 'Trái tim',
        icon: 'bi bi-heart',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️']
    },
    {
        name: 'objects',
        label: 'Đồ vật',
        icon: 'bi bi-star',
        emojis: ['⭐', '🌟', '✨', '💫', '💥', '💢', '💯', '💤', '💨', '🔥', '💧', '🌊', '🎄', '🎅', '🎁', '🎉', '🎊', '🎈', '🎀', '🎁', '🎂', '🎃', '🎄', '🎆', '🎇', '✨', '🎈', '🎉', '🎊', '🎋', '🎌', '🎍', '🎎', '🎏', '🎐', '🎑', '🎒', '🎓', '🎖️', '🎗️', '🎙️', '🎚️', '🎛️', '🎜', '🎝', '🎞️', '🎟️', '🎠', '🎡', '🎢', '🎣', '🎤', '🎥', '🎦', '🎧', '🎨', '🎩', '🎪', '🎫', '🎬', '🎭', '🎮', '🎯', '🎰', '🎱', '🎲', '🎳', '🎴', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽', '🎾', '🎿', '🏀', '🏁', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇', '🏈', '🏉', '🏊', '🏋️', '🏌️', '🏍️', '🏎️', '🏏', '🏐', '🏑', '🏒', '🏓', '🏔️', '🏕️', '🏖️', '🏗️', '🏘️', '🏙️', '🏚️', '🏛️', '🏜️', '🏝️', '🏞️', '🏟️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '🏱', '🏲', '🏳️', '🏴', '🏵️', '🏶', '🏷️', '🏸', '🏹', '🏺', '🏻', '🏼', '🏽', '🏾', '🏿']
    }
]

const selectEmoji = (emoji) => {
    emit('select', emoji)
}
</script>

<style scoped>
.emoji-picker {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 0.5rem;
    width: 320px;
    max-height: 400px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.emoji-picker__header {
    border-bottom: 1px solid #e0e0e0;
    padding: 0.5rem;
    background: #f8f9fa;
}

.emoji-picker__tabs {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.emoji-picker__tab {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: #65676b;
    transition: all 0.2s ease;
}

.emoji-picker__tab:hover {
    background: #e4e6eb;
}

.emoji-picker__tab--active {
    background: #1877f2;
    color: #ffffff;
}

.emoji-picker__body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
}

.emoji-picker__category {
    display: block;
}

.emoji-picker__category-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #65676b;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    padding: 0 0.25rem;
}

.emoji-picker__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.25rem;
}

.emoji-picker__item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.5rem;
    transition: all 0.2s ease;
    padding: 0;
}

.emoji-picker__item:hover {
    background: #f0f2f5;
    transform: scale(1.2);
}

.emoji-picker__body::-webkit-scrollbar {
    width: 6px;
}

.emoji-picker__body::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.emoji-picker__body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.emoji-picker__body::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>

