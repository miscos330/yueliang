<template>
  <div class="settings-page">
    <!-- 接粉分配 -->
    <div class="panel">
      <div class="panel-head"><span class="panel-title">接粉分配</span></div>
      <div class="panel-body">
        <el-form label-width="150px" class="s-form">
          <el-form-item label="分配策略">
            <el-select v-model="form.assignStrategy" style="width: 220px">
              <el-option label="最少会话优先" value="least" />
              <el-option label="轮询分配" value="round" />
              <el-option label="随机分配" value="random" />
            </el-select>
          </el-form-item>
          <el-form-item label="每客服最大接待数">
            <el-input-number v-model="maxPerCsNum" :min="0" :max="9999" />
            <span class="hint">0 表示不限</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveAssign">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 系统参数 -->
    <div class="panel">
      <div class="panel-head"><span class="panel-title">系统参数</span></div>
      <div class="panel-body">
        <el-form label-width="150px" class="s-form">
          <el-form-item label="系统名称">
            <el-input v-model="form.systemName" style="width: 260px" />
          </el-form-item>
          <el-form-item label="粉丝欢迎语">
            <el-input
              v-model="form.welcomeMsg"
              type="textarea"
              :rows="2"
              style="width: 380px"
              placeholder="粉丝首次进入会话时自动发送(留空则不发)"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveSystem">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 快捷回复 -->
    <div class="panel">
      <div class="panel-head"><span class="panel-title">快捷回复 / 消息模板</span></div>
      <div class="panel-body">
        <div class="qr-add">
          <el-input
            v-model="newReply"
            placeholder="输入快捷回复内容,回车或点添加"
            style="max-width: 420px"
            @keyup.enter="addReply"
          />
          <el-button type="primary" :icon="Plus" @click="addReply">添加</el-button>
        </div>
        <el-table :data="replies" empty-text="暂无快捷回复" size="small" style="width: 100%">
          <el-table-column label="内容" min-width="320">
            <template #default="{ row }">
              <el-input v-if="editingId === row.id" v-model="editContent" size="small" />
              <span v-else>{{ row.content }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170">
            <template #default="{ row }">
              <template v-if="editingId === row.id">
                <el-button type="primary" link size="small" @click="saveEdit(row)">保存</el-button>
                <el-button link size="small" @click="editingId = null">取消</el-button>
              </template>
              <template v-else>
                <el-button type="primary" link size="small" @click="startEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="removeReply(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  createQuickReply,
  deleteQuickReply,
  getQuickReplies,
  getSettings,
  saveSettings,
  updateQuickReply,
  type QuickReply,
} from '@/api/setting';

const saving = ref(false);
const form = reactive({
  systemName: '',
  welcomeMsg: '',
  assignStrategy: 'least',
  maxPerCs: '0',
});
const maxPerCsNum = ref(0);

const replies = ref<QuickReply[]>([]);
const newReply = ref('');
const editingId = ref<number | null>(null);
const editContent = ref('');

async function loadSettings() {
  try {
    const s = await getSettings();
    form.systemName = s.systemName;
    form.welcomeMsg = s.welcomeMsg;
    form.assignStrategy = s.assignStrategy;
    form.maxPerCs = s.maxPerCs;
    maxPerCsNum.value = Number(s.maxPerCs) || 0;
  } catch {
    /* 拦截器已提示 */
  }
}
async function loadReplies() {
  try {
    replies.value = await getQuickReplies();
  } catch {
    /* 忽略 */
  }
}

async function saveAssign() {
  saving.value = true;
  try {
    await saveSettings({
      assignStrategy: form.assignStrategy,
      maxPerCs: String(maxPerCsNum.value),
    });
    ElMessage.success('接粉设置已保存');
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false;
  }
}
async function saveSystem() {
  saving.value = true;
  try {
    await saveSettings({
      systemName: form.systemName,
      welcomeMsg: form.welcomeMsg,
    });
    ElMessage.success('系统参数已保存');
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false;
  }
}

async function addReply() {
  const content = newReply.value.trim();
  if (!content) return;
  try {
    await createQuickReply(content);
    newReply.value = '';
    ElMessage.success('已添加');
    loadReplies();
  } catch {
    /* 拦截器已提示 */
  }
}
function startEdit(row: QuickReply) {
  editingId.value = row.id;
  editContent.value = row.content;
}
async function saveEdit(row: QuickReply) {
  const content = editContent.value.trim();
  if (!content) return;
  try {
    await updateQuickReply(row.id, content);
    editingId.value = null;
    ElMessage.success('已保存');
    loadReplies();
  } catch {
    /* 拦截器已提示 */
  }
}
async function removeReply(row: QuickReply) {
  try {
    await ElMessageBox.confirm('确定删除这条快捷回复吗?', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await deleteQuickReply(row.id);
    ElMessage.success('已删除');
    loadReplies();
  } catch {
    /* 取消或失败 */
  }
}

onMounted(() => {
  loadSettings();
  loadReplies();
});
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.panel-head {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.panel-body {
  padding: 20px 18px;
}
.s-form {
  max-width: 560px;
}
.hint {
  margin-left: 12px;
  color: #86909c;
  font-size: 13px;
}
.qr-add {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
</style>
