import { createRouter, createWebHashHistory } from 'vue-router'
import EmployeeManage from '../views/EmployeeManage.vue'
import DepartmentManage from '../views/DepartmentManage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'
import DictionaryManage from '../views/DictionaryManage.vue'
import RolePermissionManage from '../views/RolePermissionManage.vue'
import RoleUserManage from '../views/RoleUserManage.vue'
import { User, OfficeBuilding, TrendCharts, CollectionTag, Lock, UserFilled } from '@element-plus/icons-vue'

const routes = [
  { path: '/', redirect: '/employee' },
  {
    path: '/employee',
    component: EmployeeManage,
    meta: { title: '员工管理', icon: User, permission: 'menu:employee' }
  },
  {
    path: '/department',
    component: DepartmentManage,
    meta: { title: '部门管理', icon: OfficeBuilding, permission: 'menu:department' }
  },
  {
    path: '/statistics',
    component: StatisticsPage,
    meta: { title: '数据统计', icon: TrendCharts, permission: 'menu:statistics' }
  },
  {
    path: '/dictionary',
    component: DictionaryManage,
    meta: { title: '字典管理', icon: CollectionTag, permission: 'menu:dictionary' }
  },
  {
    path: '/role-user',
    component: RoleUserManage,
    meta: { title: '角色管理', icon: UserFilled, permission: 'menu:role' }
  },
  {
    path: '/role-permission',
    component: RolePermissionManage,
    meta: { title: '权限管理', icon: Lock, permission: 'menu:role' }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
