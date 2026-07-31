<template>
  <div class="fan-demo">
    <div class="phone">
      <div class="phone-head">
        <span>🌙 月亮通讯 · 在线客服</span>
        <span class="status" :class="{ on: connected }">{{ connected ? '● 已连接' : '○ 连接中' }}</span>
      </div>

      <div class="phone-sub">
        <span>我是:{{ nickname }}</span>
        <el-button link type="primary" size="small" @click="editName">改名</el-button>
      </div>

      <div ref="msgBox" class="phone-msgs">
        <div v-if="messages.length === 0" class="tip">发条消息试试,客服会实时收到 👇</div>
        <div
          v-for="m in messages"
          :key="m.id"
          class="msg-row"
          :class="m.fromType === 'fan' ? 'self' : 'other'"
        >
          <div class="avatar">{{ m.fromType === 'fan' ? '我' : '客' }}</div>
          <div class="bubble">{{ m.content }}</div>
        </div>
      </div>

      <div class="phone-input">
        <el-input
          v-model="inputText"
          placeholder="输入消息…"
          @keyup.enter="send"
        />
        <el-button type="primary" :disabled="!inputText.trim()" @click="send">发送</el-button>
      </div>
    </div>
    <p class="hint">这是粉丝端模拟页(对应真实微信小程序用户)。开另一个浏览器标签登录客服「工作台」即可看到实时对话。</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { Socket } from 'socket.io-client';
import { ElMessageBox } from 'element-plus';
import { createFanSocket } from '@/ws/socket';

interface Msg {
  id: number;
  fromType: string;
  content: string;
}

const openid = ref(
  localStorage.getItem('fan_openid') ||
    'fan_' + Math.random().toString(36).slice(2, 10),
);
const nickname = ref(
  localStorage.getItem('fan_nickname') ||
    '访客' + Math.floor(1000 + Math.random() * 9000),
);
localStorage.setItem('fan_openid', openid.value);
localStorage.setItem('fan_nickname', nickname.value);

const connected = ref(false);
const messages = ref<Msg[]>([]);
const inputText = ref('');
const msgBox = ref<HTMLElement>();
let socket: Socket | null = null;

function connect() {
  socket?.disconnect();
  messages.value = [];
  socket = createFanSocket({ openid: openid.value, nickname: nickname.value });

  socket.on('connect', () => (connected.value = true));
  socket.on('disconnect', () => (connected.value = false));

  socket.on('fan:ready', (data: { history?: Msg[] }) => {
    if (Array.isArray(data.history)) {
      messages.value = data.history;
      scrollToBottom();
    }
  });

  socket.on('message:new', (msg: Msg) => {
    messages.value.push(msg);
    scrollToBottom();
  });
}

function send() {
  const text = inputText.value.trim();
  if (!text || !socket) return;
  socket.emit('fan:message', { content: text });
  inputText.value = '';
}

async function editName() {
  try {
    const { value } = await ElMessageBox.prompt('设置昵称', '改名', {
      inputValue: nickname.value,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    if (value && value.trim()) {
      nickname.value = value.trim();
      localStorage.setItem('fan_nickname', nickname.value);
      connect(); // 重连以更新昵称
    }
  } catch {
    /* 取消 */
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight;
  });
}

onMounted(connect);
onUnmounted(() => {
  socket?.disconnect();
  socket = null;
});
</script>

<style scoped>
.fan-demo {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6b4eff 0%, #a17cff 100%);
  padding: 20px;
}
.phone {
  width: 360px;
  height: 620px;
  background: #f2f3f5;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(40, 20, 100, 0.35);
}
.phone-head {
  background: #7c5cff;
  color: #fff;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}
.status {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
}
.status.on {
  opacity: 1;
}
.phone-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #86909c;
}
.phone-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.tip {
  text-align: center;
  color: #a8abb2;
  font-size: 13px;
  margin-top: 30px;
}
.msg-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: flex-start;
}
.msg-row.self {
  flex-direction: row-reverse;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #c9cdd4;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.msg-row.self .avatar {
  background: #7c5cff;
}
.bubble {
  max-width: 70%;
  padding: 9px 12px;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.msg-row.self .bubble {
  background: #95ec69;
}
.phone-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.hint {
  margin-top: 16px;
  max-width: 360px;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  line-height: 1.6;
}
</style>
