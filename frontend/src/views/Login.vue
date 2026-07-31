<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <span class="login-logo">🌙</span>
        <h1>月亮通讯</h1>
        <p>客服管理系统</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="onSubmit"
      >
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="onSubmit"
        >
          登 录
        </el-button>
      </el-form>
      <p class="login-tip">默认账号:admin / admin123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123' });
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await userStore.login(form.username, form.password);
      ElMessage.success('登录成功');
      const redirect = (route.query.redirect as string) || '/dashboard';
      router.replace(redirect);
    } catch {
      // 错误提示已由 axios 拦截器统一处理
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6b4eff 0%, #a17cff 100%);
}
.login-card {
  width: 360px;
  padding: 40px 32px 28px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(60, 40, 140, 0.25);
}
.login-brand {
  text-align: center;
  margin-bottom: 26px;
}
.login-logo {
  font-size: 40px;
}
.login-brand h1 {
  margin: 8px 0 2px;
  font-size: 24px;
  color: #1f2329;
  letter-spacing: 2px;
}
.login-brand p {
  margin: 0;
  color: #86909c;
  font-size: 13px;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
  letter-spacing: 4px;
}
.login-tip {
  margin: 16px 0 0;
  text-align: center;
  color: #a8abb2;
  font-size: 12px;
}
</style>
