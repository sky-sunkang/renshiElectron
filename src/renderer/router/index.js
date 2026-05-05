import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import EmployeeManage from '../views/EmployeeManage.vue'
import DepartmentManage from '../views/DepartmentManage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'
import LogStatistics from '../views/LogStatistics.vue'
import DictionaryManage from '../views/DictionaryManage.vue'
import RolePermissionManage from '../views/RolePermissionManage.vue'
import RoleUserManage from '../views/RoleUserManage.vue'
import OperationLog from '../views/OperationLog.vue'
import DatabaseManage from '../views/DatabaseManage.vue'
import AnnouncementManage from '../views/AnnouncementManage.vue'
import DataImportExport from '../views/DataImportExport.vue'
import ContractManage from '../views/ContractManage.vue'
import AttendanceManage from '../views/AttendanceManage.vue'
import { User, OfficeBuilding, TrendCharts, CollectionTag, Lock, UserFilled, Document, Grid, Setting, DataAnalysis, Histogram, Bell, Download, Tickets, Clock } from '@element-plus/icons-vue'

const routes = [
  {
    path: '/login',
    component: Login,
    meta: { title: '登录', noAuth: true }
  },
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
    path: '/contract',
    component: ContractManage,
    meta: { title: '合同管理', icon: Tickets, permission: 'menu:contract' }
  },
  {
    path: '/attendance',
    component: AttendanceManage,
    meta: { title: '考勤管理', icon: Clock, permission: 'menu:attendance' }
  },
  {
    path: '/statistics',
    meta: { title: '统计管理', icon: DataAnalysis, permission: 'menu:statistics' },
    children: [
      {
        path: '/statistics/employee',
        component: StatisticsPage,
        meta: { title: '员工统计', icon: TrendCharts, permission: 'menu:statistics:employee' }
      },
      {
        path: '/statistics/log',
        component: LogStatistics,
        meta: { title: '操作统计', icon: Histogram, permission: 'menu:statistics:log' }
      }
    ]
  },
  {
    path: '/system',
    meta: { title: '系统管理', icon: Setting, permission: 'menu:system' },
    children: [
      {
        path: '/announcement',
        component: AnnouncementManage,
        meta: { title: '公告管理', icon: Bell, permission: 'menu:announcement' }
      },
      {
        path: '/import-export',
        component: DataImportExport,
        meta: { title: '数据导入导出', icon: Download, permission: 'menu:import-export' }
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
        meta: { title: '权限管理', icon: Lock, permission: 'menu:permission' }
      },
      {
        path: '/operation-log',
        component: OperationLog,
        meta: { title: '操作日志', icon: Document, permission: 'menu:log' }
      },
      {
        path: '/database',
        component: DatabaseManage,
        meta: { title: '数据库管理', icon: Grid, permission: 'menu:database' }
      }
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

/**
 * 路由守卫：检查登录状态
 */
router.beforeEach((to, _from, next) => {
  const userStr = localStorage.getItem('currentUser')
  console.log('[Router Guard] to:', to.path, 'userStr:', !!userStr)

  // 不需要登录的页面直接放行
  if (to.meta.noAuth) {
    // 已登录用户访问登录页，跳转到首页
    if (userStr && to.path === '/login') {
      next('/statistics/employee')
      return
    }
    next()
    return
  }

  // 需要登录的页面，检查登录状态
  if (!userStr) {
    console.log('[Router Guard] redirect to login')
    next('/login')
    return
  }

  next()
})

export default router
