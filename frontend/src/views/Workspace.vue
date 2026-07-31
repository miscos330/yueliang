<template>
  <div class="workspace">
    <!-- 左:会话列表 -->
    <div class="conv-list">
      <div class="conv-head">
        <span>会话列表</span>
        <el-tag size="small" :type="connected ? 'success' : 'info'" effect="light">
          {{ connected ? '已连接' : '未连接' }}
        </el-tag>
      </div>
      <div class="conv-scroll">
        <div
          v-for="c in conversations"
          :key="c.id"
          class="conv-item"
          :class="{ active: c.id === activeId }"
          @click="selectConversation(c)"
        >
          <el-badge :value="c.unread" :hidden="!c.unread || c.id === activeId" class="conv-badge">
            <el-avatar :size="38" class="conv-avatar">{{ (c.fanNickname || '粉')[0] }}</el-avatar>
          </el-badge>
          <div class="conv-info">
            <div class="conv-top">
              <span class="conv-name">
                <span class="dot" :class="{ online: c.fanOnline }"></span>{{ c.fanNickname }}
              </span>
              <span class="conv-time">{{ shortTime(c.lastMsgAt) }}</span>
            </div>
            <div class="conv-last">{{ c.lastMsg || '暂无消息' }}</div>
          </div>
        </div>
        <div v-if="conversations.length === 0" class="conv-empty">暂无会话</div>
      </div>
    </div>

    <!-- 中:聊天窗口 -->
    <div class="chat-main">
      <template v-if="activeConv">
        <div class="chat-head">
          <span class="chat-title">
            <span class="dot" :class="{ online: activeConv.fanOnline }"></span>{{ activeConv.fanNickname }}
          </span>
        </div>
        <div ref="msgBox" class="chat-msgs">
          <div
            v-for="m in messages"
            :key="m.id"
            class="msg-row"
            :class="m.fromType === 'cs' ? 'self' : 'other'"
          >
            <el-avatar :size="32" class="msg-avatar">
              {{ m.fromType === 'cs' ? '客' : (activeConv.fanNickname || '粉')[0] }}
            </el-avatar>
            <div class="msg-bubble">{{ m.content }}</div>
          </div>
          <div v-if="messages.length === 0" class="msg-empty">开始和 {{ activeConv.fanNickname }} 对话吧</div>
        </div>
        <div class="chat-quick">
          <el-tag
            v-for="(q, i) in quickReplies"
            :key="i"
            class="quick-tag"
            @click="sendQuick(q)"
          >
            {{ q }}
          </el-tag>
        </div>
        <div class="chat-input">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="3"
            resize="none"
            placeholder="输入消息,Enter 发送 / Shift+Enter 换行"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <div class="chat-input-foot">
            <el-button type="primary" :disabled="!inputText.trim()" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </template>
      <div v-else class="chat-empty">
        <el-empty description="选择左侧会话开始聊天">
          <template #image><span style="font-size:46px">💬</span></template>
        </el-empty>
      </div>
    </div>

    <!-- 右:粉丝资料 -->
    <div class="fan-panel">
      <div class="conv-head">粉丝资料</div>
      <div v-if="activeConv" class="fan-body">
        <el-avatar :size="56" class="fan-big-avatar">{{ (activeConv.fanNickname || '粉')[0] }}</el-avatar>
        <div class="fan-name">{{ activeConv.fanNickname }}</div>
        <el-tag :type="activeConv.fanOnline ? 'success' : 'info'" size="small" effect="light">
          {{ activeConv.fanOnline ? '在线' : '离线' }}
        </el-tag>
        <el-descriptions :column="1" border size="small" class="fan-desc">
          <el-descriptions-item label="粉丝ID">{{ activeConv.fanId }}</el-descriptions-item>
          <el-descriptions-item label="会话ID">{{ activeConv.id }}</el-descriptions-item>
          <el-descriptions-item label="接待客服">{{ activeConv.csId ? '#' + activeConv.csId : '未分配' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else class="fan-empty">未选择会话</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { Socket } from 'socket.io-client';
import { ElMessage } from 'element-plus';
import {
  getConversations,
  getMessages,
  type Conversation,
  type Message,
} from '@/api/chat';
import { createCsSocket } from '@/ws/socket';
import { getQuickReplies } from '@/api/setting';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const conversations = ref<Conversation[]>([]);
const activeId = ref<number | null>(null);
const messages = ref<Message[]>([]);
const inputText = ref('');
const connected = ref(false);
const msgBox = ref<HTMLElement>();
let socket: Socket | null = null;

const quickReplies = ref<string[]>([
  '您好,很高兴为您服务~',
  '请问有什么可以帮您?',
  '稍等,我帮您查一下',
  '感谢咨询,祝您生活愉快!',
]);

const activeConv = computed(() =>
  conversations.value.find((c) => c.id === activeId.value),
);

async function loadConversations() {
  try {
    conversations.value = await getConversations();
  } catch {
    /* 拦截器已提示 */
  }
}

async function selectConversation(c: Conversation) {
  activeId.value = c.id;
  c.unread = 0;
  try {
    messages.value = await getMessages(c.id);
    socket?.emit('cs:read', { conversationId: c.id });
    scrollToBottom();
  } catch {
    /* 忽略 */
  }
}

function sendMessage() {
  const text = inputText.value.trim();
  if (!text || !activeId.value || !socket) return;
  socket.emit('cs:message', { conversationId: activeId.value, content: text });
  inputText.value = '';
}
function sendQuick(q: string) {
  if (!activeId.value || !socket) return;
  socket.emit('cs:message', { conversationId: activeId.value, content: q });
}

function scrollToBottom() {
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight;
  });
}

function upsertConversation(brief: Partial<Conversation> & { id: number }) {
  const idx = conversations.value.findIndex((c) => c.id === brief.id);
  if (idx >= 0) {
    conversations.value[idx] = { ...conversations.value[idx], ...brief };
    // 移到顶部
    const [item] = conversations.value.splice(idx, 1);
    conversations.value.unshift(item);
  } else {
    conversations.value.unshift(brief as Conversation);
  }
}

onMounted(() => {
  loadConversations();
  getQuickReplies()
    .then((list) => {
      if (list.length) quickReplies.value = list.map((r) => r.content);
    })
    .catch(() => {});
  socket = createCsSocket(userStore.token);

  socket.on('connect', () => (connected.value = true));
  socket.on('disconnect', () => (connected.value = false));

  socket.on('message:new', (msg: Message) => {
    if (msg.conversationId === activeId.value) {
      messages.value.push(msg);
      scrollToBottom();
      if (msg.fromType === 'fan') socket?.emit('cs:read', { conversationId: msg.conversationId });
    } else if (msg.fromType === 'fan') {
      const c = conversations.value.find((x) => x.id === msg.conversationId);
      if (c) c.unread = (c.unread || 0) + 1;
    }
    // 更新列表预览
    const c = conversations.value.find((x) => x.id === msg.conversationId);
    if (c) {
      c.lastMsg = msg.content;
      c.lastMsgAt = msg.createdAt;
    }
  });

  socket.on('conversation:update', (brief: (Conversation & { id: number }) | null) => {
    if (brief) upsertConversation(brief);
  });
});

onUnmounted(() => {
  socket?.disconnect();
  socket = null;
});

function shortTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<style scoped>
.workspace {
  display: flex;
  height: 100%;
  gap: 16px;
}
.conv-list,
.fan-panel {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}
.fan-panel {
  width: 240px;
}
.chat-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}
.conv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.conv-scroll {
  flex: 1;
  overflow-y: auto;
}
.conv-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f7f7f7;
}
.conv-item:hover {
  background: #f7f6ff;
}
.conv-item.active {
  background: #f0ecff;
}
.conv-avatar {
  background: #7c5cff;
  color: #fff;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.conv-name {
  font-size: 14px;
  color: #1f2329;
  font-weight: 500;
  display: flex;
  align-items: center;
}
.conv-time {
  font-size: 12px;
  color: #a8abb2;
}
.conv-last {
  margin-top: 3px;
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-empty,
.fan-empty,
.msg-empty {
  padding: 40px 0;
  text-align: center;
  color: #a8abb2;
  font-size: 13px;
}
.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c9cdd4;
  margin-right: 6px;
}
.dot.online {
  background: #52c41a;
}
.chat-head {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.chat-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
  display: flex;
  align-items: center;
}
.chat-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  background: #f7f8fa;
}
.msg-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.msg-row.self {
  flex-direction: row-reverse;
}
.msg-avatar {
  background: #c9cdd4;
  color: #fff;
  flex-shrink: 0;
}
.msg-row.self .msg-avatar {
  background: #7c5cff;
}
.msg-bubble {
  max-width: 62%;
  padding: 9px 13px;
  border-radius: 8px;
  background: #fff;
  color: #1f2329;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.msg-row.self .msg-bubble {
  background: #7c5cff;
  color: #fff;
}
.chat-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 18px 0;
}
.quick-tag {
  cursor: pointer;
}
.chat-input {
  padding: 10px 18px 14px;
  border-top: 1px solid #f0f0f0;
}
.chat-input-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fan-body {
  padding: 24px 16px;
  text-align: center;
}
.fan-big-avatar {
  background: #7c5cff;
  color: #fff;
  font-size: 22px;
}
.fan-name {
  margin: 10px 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}
.fan-desc {
  margin-top: 18px;
  text-align: left;
}
</style>
