<template>
  <div class="miniapp-page">
    <div class="panel">
      <!-- 头部:标题 + 操作按钮 -->
      <div class="panel-head">
        <span class="panel-title">小程序列表</span>
        <div class="head-actions">
          <el-button
            type="danger"
            plain
            :disabled="selectedIds.length === 0"
            @click="onBatchDelete"
          >
            批量删除 ({{ selectedIds.length }})
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">添加小程序</el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索小程序名称或AppID"
          clearable
          style="width: 260px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onRefresh">刷新</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="list"
        v-loading="loading"
        empty-text="暂无数据"
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column prop="adminName" label="管理员" min-width="100" show-overflow-tooltip />
        <el-table-column prop="name" label="小程序" min-width="130" show-overflow-tooltip />
        <el-table-column prop="appid" label="AppID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="appSecret" label="AppSecret" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="(val: any) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="客服可切换" width="100">
          <template #default="{ row }">
            <el-tag :type="row.csSwitchable ? 'success' : 'info'" size="small" effect="light">
              {{ row.csSwitchable ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="csCount" label="客服数" width="90" sortable />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="msgTemplate" label="消息模板" min-width="110" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" min-width="160" sortable>
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="panel-foot">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="query.page"
          :page-size="query.pageSize"
          :page-sizes="[20, 50, 100]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <!-- 添加 / 编辑 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加小程序' : '编辑小程序'"
      width="520px"
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="小程序名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入小程序名称" />
        </el-form-item>
        <el-form-item label="AppID" prop="appid">
          <el-input v-model="form.appid" placeholder="wx 开头的 AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="appSecret">
          <el-input v-model="form.appSecret" placeholder="请输入 AppSecret" show-password />
        </el-form-item>
        <el-form-item label="消息模板">
          <el-input v-model="form.msgTemplate" placeholder="消息模板 ID(可选)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          <span class="form-hint">{{ form.status === 1 ? '启用' : '禁用' }}</span>
        </el-form-item>
        <el-form-item label="客服可切换">
          <el-switch v-model="form.csSwitchable" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注(可选)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import {
  batchDeleteMiniApp,
  createMiniApp,
  deleteMiniApp,
  getMiniApps,
  updateMiniApp,
  type MiniApp,
} from '@/api/miniapp';

const loading = ref(false);
const list = ref<MiniApp[]>([]);
const total = ref(0);
const query = reactive({ keyword: '', page: 1, pageSize: 20 });
const selectedIds = ref<number[]>([]);

async function load() {
  loading.value = true;
  try {
    const res = await getMiniApps(query);
    list.value = res.list;
    total.value = res.total;
  } catch {
    // 错误提示已由拦截器处理
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.page = 1;
  load();
}
function onRefresh() {
  query.keyword = '';
  query.page = 1;
  load();
}
function onPageChange(p: number) {
  query.page = p;
  load();
}
function onSizeChange(s: number) {
  query.pageSize = s;
  query.page = 1;
  load();
}
function onSelectionChange(rows: MiniApp[]) {
  selectedIds.value = rows.map((r) => r.id);
}

// ===== 弹窗 =====
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const editingId = ref<number | null>(null);
const saving = ref(false);
const formRef = ref<FormInstance>();
const defaultForm = () => ({
  name: '',
  appid: '',
  appSecret: '',
  status: 1,
  csSwitchable: true,
  msgTemplate: '',
  remark: '',
});
const form = reactive(defaultForm());
const rules: FormRules = {
  name: [{ required: true, message: '请输入小程序名称', trigger: 'blur' }],
  appid: [{ required: true, message: '请输入 AppID', trigger: 'blur' }],
  appSecret: [{ required: true, message: '请输入 AppSecret', trigger: 'blur' }],
};

function openAdd() {
  dialogMode.value = 'add';
  editingId.value = null;
  Object.assign(form, defaultForm());
  dialogVisible.value = true;
}
function openEdit(row: MiniApp) {
  dialogMode.value = 'edit';
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    appid: row.appid,
    appSecret: row.appSecret,
    status: row.status,
    csSwitchable: row.csSwitchable,
    msgTemplate: row.msgTemplate ?? '',
    remark: row.remark ?? '',
  });
  dialogVisible.value = true;
}
function onDialogClosed() {
  formRef.value?.clearValidate();
}

async function onSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      if (dialogMode.value === 'add') {
        await createMiniApp({ ...form });
        ElMessage.success('添加成功');
      } else if (editingId.value != null) {
        await updateMiniApp(editingId.value, { ...form });
        ElMessage.success('保存成功');
      }
      dialogVisible.value = false;
      load();
    } catch {
      // 拦截器已提示
    } finally {
      saving.value = false;
    }
  });
}

async function toggleStatus(row: MiniApp, val: number) {
  try {
    await updateMiniApp(row.id, { status: val });
    ElMessage.success(val === 1 ? '已启用' : '已禁用');
  } catch {
    row.status = val === 1 ? 0 : 1; // 失败回滚
  }
}

async function onDelete(row: MiniApp) {
  try {
    await ElMessageBox.confirm(`确定删除小程序「${row.name}」吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await deleteMiniApp(row.id);
    ElMessage.success('删除成功');
    load();
  } catch {
    // 取消或失败
  }
}

async function onBatchDelete() {
  if (selectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedIds.value.length} 个小程序吗?`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    );
    const res = await batchDeleteMiniApp(selectedIds.value);
    ElMessage.success(`已删除 ${res.count} 个`);
    load();
  } catch {
    // 取消或失败
  }
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(load);
</script>

<style scoped>
.miniapp-page {
  display: flex;
  flex-direction: column;
}
.panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: 0 0 16px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}
.head-actions {
  display: flex;
  gap: 10px;
}
.search-bar {
  display: flex;
  gap: 10px;
  padding: 16px 18px;
}
.panel-foot {
  display: flex;
  justify-content: flex-end;
  padding: 16px 18px 0;
}
.form-hint {
  margin-left: 10px;
  color: #86909c;
  font-size: 13px;
}
:deep(.el-table) {
  padding: 0 18px;
}
</style>
