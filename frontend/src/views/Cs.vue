<template>
  <div class="cs-page">
    <div class="panel">
      <!-- 头部 -->
      <div class="panel-head">
        <span class="panel-title">客服管理</span>
        <div class="head-actions">
          <el-button :icon="Files" @click="openGroupManager">分组管理</el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">添加客服</el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索昵名或账号"
          clearable
          style="width: 220px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-select v-model="query.role" placeholder="全部角色" clearable style="width: 130px" @change="onSearch">
          <el-option label="管理员" value="admin" />
          <el-option label="客服" value="cs" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="onRefresh">刷新</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="list" v-loading="loading" empty-text="暂无数据" style="width: 100%">
        <el-table-column prop="nickname" label="昵名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="username" label="账号" min-width="120" show-overflow-tooltip />
        <el-table-column label="角色" width="90">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'warning' : 'primary'" size="small" effect="light">
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分组" min-width="100">
          <template #default="{ row }">{{ row.group?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="在线状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small" effect="light">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fansCount" label="接粉数" width="90" sortable />
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
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="最后登录" min-width="150">
          <template #default="{ row }">{{ formatTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="openReset(row)">重置密码</el-button>
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

    <!-- 添加 / 编辑 客服 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加客服' : '编辑客服'"
      width="520px"
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="昵名" prop="nickname">
          <el-input v-model="form.nickname" placeholder="显示昵名" />
        </el-form-item>
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="登录用户名" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'add'" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="至少 6 位" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio value="cs">客服</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="form.groupId" placeholder="选择分组" style="width: 100%">
            <el-option label="无分组" :value="0" />
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          <span class="form-hint">{{ form.status === 1 ? '启用' : '禁用' }}</span>
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

    <!-- 重置密码 -->
    <el-dialog v-model="pwdVisible" title="重置密码" width="420px" @closed="pwdRef?.clearValidate()">
      <p class="pwd-tip">为「{{ pwdTarget?.nickname }}」设置新密码</p>
      <el-form ref="pwdRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" placeholder="至少 6 位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="onResetSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分组管理 -->
    <el-dialog v-model="groupVisible" title="客服分组管理" width="560px">
      <div class="group-form">
        <el-input v-model="groupForm.name" placeholder="分组名" style="width: 150px" />
        <el-input v-model="groupForm.remark" placeholder="备注(可选)" style="flex: 1" />
        <el-button type="primary" :loading="groupSaving" @click="submitGroup">
          {{ groupForm.id ? '保存' : '添加' }}
        </el-button>
        <el-button v-if="groupForm.id" @click="resetGroupForm">取消</el-button>
      </div>
      <el-table :data="groupList" empty-text="暂无分组" size="small" style="width: 100%">
        <el-table-column prop="name" label="分组名" min-width="120" />
        <el-table-column prop="memberCount" label="成员数" width="80" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editGroup(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteGroup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Files, Plus, Refresh, Search } from '@element-plus/icons-vue';
import {
  createCs,
  createCsGroup,
  deleteCs,
  deleteCsGroup,
  getCsGroups,
  getCsList,
  resetCsPassword,
  updateCs,
  updateCsGroup,
  type Cs,
  type CsGroup,
} from '@/api/cs';

const loading = ref(false);
const list = ref<Cs[]>([]);
const total = ref(0);
const query = reactive({ keyword: '', role: '', page: 1, pageSize: 20 });
const groups = ref<CsGroup[]>([]);

async function load() {
  loading.value = true;
  try {
    const res = await getCsList(query);
    list.value = res.list;
    total.value = res.total;
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false;
  }
}
async function loadGroups() {
  try {
    groups.value = await getCsGroups();
  } catch {
    /* 忽略 */
  }
}

function onSearch() {
  query.page = 1;
  load();
}
function onRefresh() {
  query.keyword = '';
  query.role = '';
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

// ===== 添加 / 编辑 =====
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const editingId = ref<number | null>(null);
const saving = ref(false);
const formRef = ref<FormInstance>();
const defaultForm = () => ({
  username: '',
  password: '',
  nickname: '',
  role: 'cs',
  groupId: 0,
  status: 1,
  remark: '',
});
const form = reactive(defaultForm());
const rules: FormRules = {
  nickname: [{ required: true, message: '请输入昵名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码(至少 6 位)', trigger: 'blur' }],
};

function openAdd() {
  dialogMode.value = 'add';
  editingId.value = null;
  Object.assign(form, defaultForm());
  loadGroups();
  dialogVisible.value = true;
}
function openEdit(row: Cs) {
  dialogMode.value = 'edit';
  editingId.value = row.id;
  Object.assign(form, {
    username: row.username,
    password: '',
    nickname: row.nickname,
    role: row.role,
    groupId: row.groupId ?? 0,
    status: row.status,
    remark: row.remark ?? '',
  });
  loadGroups();
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
        await createCs({
          username: form.username,
          password: form.password,
          nickname: form.nickname,
          role: form.role,
          groupId: form.groupId,
          status: form.status,
          remark: form.remark,
        });
        ElMessage.success('添加成功');
      } else if (editingId.value != null) {
        await updateCs(editingId.value, {
          nickname: form.nickname,
          role: form.role,
          groupId: form.groupId,
          status: form.status,
          remark: form.remark,
        });
        ElMessage.success('保存成功');
      }
      dialogVisible.value = false;
      load();
    } catch {
      /* 拦截器已提示 */
    } finally {
      saving.value = false;
    }
  });
}

async function toggleStatus(row: Cs, val: number) {
  try {
    await updateCs(row.id, { status: val });
    ElMessage.success(val === 1 ? '已启用' : '已禁用');
  } catch {
    row.status = val === 1 ? 0 : 1;
  }
}

async function onDelete(row: Cs) {
  try {
    await ElMessageBox.confirm(`确定删除客服「${row.nickname}」吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await deleteCs(row.id);
    ElMessage.success('删除成功');
    load();
  } catch {
    /* 取消或失败 */
  }
}

// ===== 重置密码 =====
const pwdVisible = ref(false);
const pwdTarget = ref<Cs | null>(null);
const pwdSaving = ref(false);
const pwdRef = ref<FormInstance>();
const pwdForm = reactive({ password: '' });
const pwdRules: FormRules = {
  password: [{ required: true, message: '请输入新密码(至少 6 位)', min: 6, trigger: 'blur' }],
};
function openReset(row: Cs) {
  pwdTarget.value = row;
  pwdForm.password = '';
  pwdVisible.value = true;
}
async function onResetSubmit() {
  if (!pwdRef.value || !pwdTarget.value) return;
  await pwdRef.value.validate(async (valid) => {
    if (!valid) return;
    pwdSaving.value = true;
    try {
      await resetCsPassword(pwdTarget.value!.id, pwdForm.password);
      ElMessage.success('密码已重置');
      pwdVisible.value = false;
    } catch {
      /* 拦截器已提示 */
    } finally {
      pwdSaving.value = false;
    }
  });
}

// ===== 分组管理 =====
const groupVisible = ref(false);
const groupList = ref<CsGroup[]>([]);
const groupSaving = ref(false);
const groupForm = reactive<{ id: number | null; name: string; remark: string }>({
  id: null,
  name: '',
  remark: '',
});
async function openGroupManager() {
  groupVisible.value = true;
  resetGroupForm();
  await loadGroupList();
}
async function loadGroupList() {
  try {
    groupList.value = await getCsGroups();
  } catch {
    /* 忽略 */
  }
}
function resetGroupForm() {
  groupForm.id = null;
  groupForm.name = '';
  groupForm.remark = '';
}
function editGroup(g: CsGroup) {
  groupForm.id = g.id;
  groupForm.name = g.name;
  groupForm.remark = g.remark ?? '';
}
async function submitGroup() {
  if (!groupForm.name.trim()) {
    ElMessage.warning('请输入分组名');
    return;
  }
  groupSaving.value = true;
  try {
    if (groupForm.id) {
      await updateCsGroup(groupForm.id, { name: groupForm.name, remark: groupForm.remark });
      ElMessage.success('分组已更新');
    } else {
      await createCsGroup({ name: groupForm.name, remark: groupForm.remark });
      ElMessage.success('分组已添加');
    }
    resetGroupForm();
    await Promise.all([loadGroupList(), loadGroups()]);
  } catch {
    /* 拦截器已提示 */
  } finally {
    groupSaving.value = false;
  }
}
async function deleteGroup(g: CsGroup) {
  try {
    await ElMessageBox.confirm(
      `确定删除分组「${g.name}」吗?组内客服会变为「无分组」。`,
      '提示',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    );
    await deleteCsGroup(g.id);
    ElMessage.success('删除成功');
    await Promise.all([loadGroupList(), loadGroups(), load()]);
  } catch {
    /* 取消或失败 */
  }
}

// ===== 工具 =====
function roleLabel(role: string) {
  return role === 'admin' ? '管理员' : '客服';
}
function formatTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(() => {
  load();
  loadGroups();
});
</script>

<style scoped>
.cs-page {
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
.pwd-tip {
  margin: 0 0 16px;
  color: #4e5969;
  font-size: 14px;
}
.group-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
:deep(.el-table) {
  padding: 0 18px;
}
</style>
