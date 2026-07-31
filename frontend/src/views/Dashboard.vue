<template>
  <div class="dashboard">
    <!-- 顶部统计卡 -->
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in overviewCards" :key="card.key">
        <div class="stat-card">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 实时数据 + 客服工作量 -->
    <el-row :gutter="16">
      <el-col :span="10">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">实时数据</span>
            <el-button size="small" :icon="Refresh" :loading="loading" @click="loadAll">
              刷新
            </el-button>
          </div>
          <div class="panel-body">
            <div
              v-for="(item, i) in realtimeRows"
              :key="item.key"
              class="realtime-row"
              :class="{ 'no-border': i === 0 }"
            >
              <span class="realtime-label">{{ item.label }}:</span>
              <span class="realtime-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="14">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">客服工作量</span>
          </div>
          <div class="panel-body">
            <el-table :data="workload.list" style="width: 100%" empty-text="暂无数据">
              <el-table-column prop="nickname" label="客服昵名" min-width="120" />
              <el-table-column label="在线状态" min-width="90">
                <template #default="{ row }">
                  <el-tag :type="row.online ? 'success' : 'info'" size="small" effect="light">
                    {{ row.online ? '在线' : '离线' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="fansCount" label="接粉数" min-width="80" />
              <el-table-column prop="remark" label="备注" min-width="100" />
              <el-table-column label="最后登录" min-width="150">
                <template #default="{ row }">{{ formatTime(row.lastLogin) }}</template>
              </el-table-column>
            </el-table>
            <div class="panel-foot">
              <el-pagination
                small
                background
                layout="total, sizes, prev, pager, next"
                :total="workload.total"
                :page-size="10"
                :page-sizes="[10, 20, 50]"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import {
  getCsWorkload,
  getOverview,
  getRealtime,
  type CsWorkloadItem,
  type Overview,
  type Realtime,
} from '@/api/stats';

const loading = ref(false);
const overview = reactive<Overview>({
  miniappCount: 0,
  csCount: 0,
  todayNewFans: 0,
  todayMessages: 0,
});
const realtime = reactive<Realtime>({
  csOnline: 0,
  fansOnline: 0,
  todayMessages: 0,
  todaySessions: 0,
  todayDeletedSessions: 0,
});
const workload = reactive<{ list: CsWorkloadItem[]; total: number }>({
  list: [],
  total: 0,
});

const overviewCards = computed(() => [
  { key: 'miniappCount', label: '小程序数量', value: overview.miniappCount },
  { key: 'csCount', label: '客服数量', value: overview.csCount },
  { key: 'todayNewFans', label: '今日接粉', value: overview.todayNewFans },
  { key: 'todayMessages', label: '今日消息', value: overview.todayMessages },
]);

const realtimeRows = computed(() => [
  { key: 'csOnline', label: '客服在线数', value: realtime.csOnline },
  { key: 'fansOnline', label: '粉在线数', value: realtime.fansOnline },
  { key: 'todayMessages', label: '今日消息数', value: realtime.todayMessages },
  { key: 'todaySessions', label: '今日会话总数', value: realtime.todaySessions },
  {
    key: 'todayDeletedSessions',
    label: '今日会话删除数',
    value: realtime.todayDeletedSessions,
  },
]);

async function loadAll() {
  loading.value = true;
  try {
    const [ov, rt, wl] = await Promise.all([
      getOverview(),
      getRealtime(),
      getCsWorkload(),
    ]);
    Object.assign(overview, ov);
    Object.assign(realtime, rt);
    workload.list = wl.list;
    workload.total = wl.total;
  } catch {
    // 错误提示已由拦截器处理
  } finally {
    loading.value = false;
  }
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(loadAll);
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stat-card {
  padding: 26px 20px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.stat-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  color: #1f2329;
}
.stat-label {
  margin-top: 10px;
  font-size: 14px;
  color: #86909c;
}
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
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
.panel-body {
  flex: 1;
  padding: 6px 18px 16px;
}
.realtime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid #f5f5f5;
}
.realtime-row.no-border {
  border-top: none;
}
.realtime-label {
  font-size: 14px;
  color: #4e5969;
}
.realtime-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2329;
}
.panel-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
