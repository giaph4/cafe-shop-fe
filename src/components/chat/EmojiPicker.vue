<template>
    <div class="emoji-picker">
        <div class="emoji-picker__header">
            <h6 class="mb-0">Chọn emoji</h6>
            <button class="btn btn-sm btn-link p-0" @click="$emit('close')">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="emoji-picker__grid">
            <button
                v-for="emoji in emojis"
                :key="emoji"
                class="emoji-picker__item"
                @click="handleSelect(emoji)"
            >
                {{ emoji }}
            </button>
        </div>
    </div>
</template>

<script setup>
const emit = defineEmits(['select', 'close'])

const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
    '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
    '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
    '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
    '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄',
    '💋', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️',
    '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️',
    '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
    '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
    '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
    '👁️', '👅', '👄', '💋', '💘', '💝', '💖', '💗', '💓', '💞',
    '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜',
    '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️',
    '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'
]

const handleSelect = (emoji) => {
    emit('select', emoji)
}
</script>

<style scoped lang="scss">
.emoji-picker {
    position: absolute;
    bottom: 100%;
    left: 0;
    width: 320px;
    max-height: 300px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--component-radius-sm);
    box-shadow: var(--component-shadow-hover);
    z-index: 1000;
    margin-bottom: 0.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.emoji-picker__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--component-gap-sm) var(--component-padding-sm);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.emoji-picker__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.25rem;
    padding: 0.75rem;
    overflow-y: auto;
    max-height: 250px;
}

.emoji-picker__item {
    background: transparent;
    border: none;
    padding: 0.5rem;
    border-radius: var(--component-radius-sm);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all var(--component-transition);

    &:hover {
        background: var(--color-card-muted);
        transform: scale(1.2);
    }
}
</style>

