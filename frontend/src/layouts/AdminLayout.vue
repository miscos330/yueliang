<template>
  <el-container class="admin-layout">
    <!-- 顶栏 -->
    <el-header height="56px" class="admin-header">
      <div class="brand">
        <span class="brand-logo">🌙</span>
        <span class="brand-name">月亮通讯</span>
      </div>
      <el-dropdown @command="onCommand">
        <span class="user-trigger">
          <el-avatar :size="28" class="user-avatar">{{ avatarText }}</el-avatar>
          <span class="user-name">{{ user?.nickname || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-header>

    <el-container class="admin-body">
      <!-- 侧边菜单 -->
      <el-aside width="200px" class="admin-aside">
        <el-menu router :default-active="route.path" class="admin-menu">
          <el-menu-item index="/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="/miniapp">
            <el-icon><Grid /></el-icon>
            <span>小程序</span>
          </el-menu-item>
          <el-menu-item index="/cs">
            <el-icon><Service /></el-icon>
            <span>客服</span>
          </el-menu-item>
          <el-menu-item index="/workspace">
            <el-icon><ChatDotRound /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 内容区 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const avatarText = computed(() => (userStore.user?.nickname || '管')[0]);

async function onCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗?', '提示', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消',
      });
      userStore.logout();
      router.replace('/login');
    } catch {
      // 取消,忽略
    }
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #7c5cff;
}
.brand-logo {
  font-size: 20px;
}
.brand-name {
  letter-spacing: 1px;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
  color: #4e5969;
}
.user-avatar {
  background: #7c5cff;
  color: #fff;
  font-size: 13px;
}
.admin-body {
  height: calc(100vh - 56px);
}
.admin-aside {
  background: #fff;
  border-right: 1px solid #ebeef5;
}
.admin-menu {
  border-right: none;
}
.admin-main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}
</style>
