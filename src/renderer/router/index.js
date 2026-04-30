import { createRouter, createWebHashHistory } from 'vue-router'
import EmployeeManage from '../views/EmployeeManage.vue'
import DepartmentManage from '../views/DepartmentManage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'
import DictionaryManage from '../views/DictionaryManage.vue'
import { User, OfficeBuilding, TrendCharts, CollectionTag } from '@element-plus/icons-vue'

const routes = [
  { path: '/', redirect: '/employee' },
  {
    path: '/employee',
    component: EmployeeManage,
    meta: { title: '员工管理', icon: User }
  },
  {
    path: '/department',
    component: DepartmentManage,
    meta: { title: '部门管理', icon: OfficeBuilding }
  },
  {
    path: '/statistics',
    component: StatisticsPage,
    meta: { title: '数据统计', icon: TrendCharts }
  },
  {
    path: '/dictionary',
    component: DictionaryManage,
    meta: { title: '字典管理', icon: CollectionTag }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
