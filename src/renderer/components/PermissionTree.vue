<template>
  <el-collapse v-model="expandedModules" class="permission-collapse">
    <el-collapse-item v-for="module in permissionModules" :key="module.name" :name="module.name">
      <template #title>
        <span class="collapse-title">{{ module.name }}</span>
        <span class="collapse-count">({{ getModuleCount(module) }})</span>
      </template>
      <!-- 菜单权限 -->
      <div v-if="module.menus.length > 0" class="permission-group">
        <el-checkbox-group v-model="localSelected" :disabled="disabled">
          <el-checkbox v-for="perm in module.menus" :key="perm.code" :label="perm.code">
            {{ perm.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <!-- 操作权限 -->
      <div v-if="module.actions.length > 0" class="permission-group">
        <el-checkbox-group v-model="localSelected" :disabled="disabled">
          <el-checkbox v-for="perm in module.actions" :key="perm.code" :label="perm.code">
            {{ perm.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <!-- 子模块 -->
      <div v-if="module.children && module.children.length > 0" class="permission-children">
        <div v-for="child in module.children" :key="child.name" class="child-module">
          <div class="child-header">
            <span class="child-title">{{ child.name }}</span>
            <span class="child-count">({{ getChildCount(child) }})</span>
          </div>
          <div class="child-content">
            <!-- 子模块菜单权限 -->
            <div v-if="child.menus.length > 0" class="permission-group inline">
              <el-checkbox-group v-model="localSelected" :disabled="disabled">
                <el-checkbox v-for="perm in child.menus" :key="perm.code" :label="perm.code">
                  {{ perm.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <!-- 子模块操作权限 -->
            <div v-if="child.actions.length > 0" class="permission-group inline">
              <el-checkbox-group v-model="localSelected" :disabled="disabled">
                <el-checkbox v-for="perm in child.actions" :key="perm.code" :label="perm.code">
                  {{ perm.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  permissions: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:selected'])

// 本地选中状态
const localSelected = ref([])

// 是否正在从外部更新
let isUpdatingFromProps = false

// 监听外部变化
watch(() => props.selected, (newVal) => {
  isUpdatingFromProps = true
  localSelected.value = [...newVal]
  // 下一帧重置标志
  requestAnimationFrame(() => {
    isUpdatingFromProps = false
  })
}, { immediate: true })

// 监听本地变化，通知父组件（跳过从外部更新的情况）
watch(localSelected, (newVal) => {
  if (!isUpdatingFromProps) {
    emit('update:selected', [...newVal])
  }
}, { deep: true })

// 展开的模块
const expandedModules = ref([])

// 权限模块定义
const moduleConfig = [
  { name: '工作台', menuPrefix: 'menu:dashboard', actionPrefix: null },
  { name: '员工管理', menuPrefix: 'menu:employee', actionPrefix: 'emp:' },
  { name: '部门管理', menuPrefix: 'menu:department', actionPrefix: 'dept:' },
  { name: '合同管理', menuPrefix: 'menu:contract', actionPrefix: 'contract:' },
  { name: '考勤管理', menuPrefix: 'menu:attendance', actionPrefix: 'attendance:' },
  { name: '招聘管理', menuPrefix: 'menu:recruitment', actionPrefix: 'position:' },
  { name: '绩效考核', menuPrefix: 'menu:performance', actionPrefix: 'indicator:' },
  { name: '薪资管理', menuPrefix: 'menu:salary', actionPrefix: 'salary:' },
  {
    name: '统计管理',
    menuPrefix: 'menu:statistics',
    actionPrefix: null,
    children: [
      { name: '员工统计', menuPrefix: 'menu:statistics:employee', actionPrefix: null },
      { name: '操作统计', menuPrefix: 'menu:statistics:log', actionPrefix: null },
      { name: '考勤统计', menuPrefix: 'menu:statistics:attendance', actionPrefix: null },
      { name: '绩效统计', menuPrefix: 'menu:statistics:performance', actionPrefix: null },
      { name: '招聘统计', menuPrefix: 'menu:statistics:recruitment', actionPrefix: null },
      { name: '合同统计', menuPrefix: 'menu:statistics:contract', actionPrefix: null }
    ]
  },
  {
    name: '系统管理',
    menuPrefix: 'menu:system',
    actionPrefix: null,
    children: [
      { name: '公告管理', menuPrefix: 'menu:announcement', actionPrefix: 'announcement:' },
      { name: '数据导入导出', menuPrefix: 'menu:import-export', actionPrefix: 'import-export:' },
      { name: '字典管理', menuPrefix: 'menu:dictionary', actionPrefix: 'dict:' },
      { name: '角色管理', menuPrefix: 'menu:role', actionPrefix: 'role:' },
      { name: '权限管理', menuPrefix: 'menu:permission', actionPrefix: 'permission:' },
      { name: '操作日志', menuPrefix: 'menu:log', actionPrefix: null },
      { name: '工作日历', menuPrefix: 'menu:calendar', actionPrefix: 'calendar:' },
      { name: '数据库管理', menuPrefix: 'menu:database', actionPrefix: 'db:' }
    ]
  }
]

/**
 * 获取所有模块名称
 */
function getAllModuleNames() {
  const names = []
  moduleConfig.forEach(m => {
    names.push(m.name)
    if (m.children) {
      m.children.forEach(c => names.push(c.name))
    }
  })
  return names
}

/**
 * 计算模块权限数量
 */
function getModuleCount(module) {
  let count = module.menus.length + module.actions.length
  if (module.children) {
    module.children.forEach(child => {
      count += child.menus.length + child.actions.length
    })
  }
  return count
}

/**
 * 计算子模块权限数量
 */
function getChildCount(child) {
  return child.menus.length + child.actions.length
}

/**
 * 获取单个模块的权限数据
 */
function getModuleData(config) {
  // 获取菜单权限
  const menus = props.permissions.filter(p =>
    p.type === 'menu' && (
      p.code === config.menuPrefix ||
      p.code.startsWith(config.menuPrefix + ':')
    )
  )

  // 获取操作权限
  let actions = []
  if (config.actionPrefix) {
    actions = props.permissions.filter(p => p.code.startsWith(config.actionPrefix))
  }

  return {
    name: config.name,
    menus,
    actions,
    children: config.children ? config.children.map(child => getModuleData(child)) : []
  }
}

// 按模块分组的权限
const permissionModules = computed(() => {
  return moduleConfig.map(config => getModuleData(config))
    .filter(module => module.menus.length > 0 || module.actions.length > 0 || module.children.length > 0)
})

onMounted(() => {
  // 默认展开所有模块
  expandedModules.value = getAllModuleNames()
})
</script>

<style scoped>
.permission-collapse {
  border: none;
}

.permission-collapse :deep(.el-collapse-item__header) {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  height: auto;
  line-height: 1.5;
  font-size: 14px;
}

.permission-collapse :deep(.el-collapse-item__header:hover) {
  background: #e2e8f0;
}

.permission-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}

.permission-collapse :deep(.el-collapse-item__content) {
  padding: 8px 0 4px 0;
}

.collapse-title {
  font-weight: 600;
  color: #1e293b;
}

.collapse-count {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.permission-group {
  margin-bottom: 8px;
}

.permission-group.inline {
  margin-bottom: 4px;
}

.permission-children {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.child-module {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 10px;
}

.child-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.child-title {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.child-count {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 4px;
}

.child-content {
  padding-top: 4px;
}

.permission-collapse :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-collapse :deep(.el-checkbox) {
  margin-right: 0;
}

.permission-collapse :deep(.el-checkbox__label) {
  font-size: 13px;
}
</style>