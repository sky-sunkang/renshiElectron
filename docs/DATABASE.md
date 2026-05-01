# 数据库表结构说明

## departments（部门表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 部门名称 |
| description | TEXT | 部门描述 |
| parent_id | INTEGER | 父部门ID，0表示顶级部门 |
| path_ids | TEXT | 部门路径ID（如：1,2,8） |
| path_names | TEXT | 部门路径名称（如：xx公司/技术部/前端组） |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## employees（员工表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 员工姓名 |
| account | TEXT | 登录账号 |
| password | TEXT | 登录密码 |
| gender | TEXT | 性别 |
| age | INTEGER | 年龄 |
| phone | TEXT | 手机号 |
| email | TEXT | 邮箱 |
| department_id | INTEGER | 所属部门ID |
| position | TEXT | 职位 |
| salary | REAL | 薪资 |
| avatar | TEXT | 头像（Base64格式） |
| role_code | TEXT | 主角色代码 |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## dict_types（字典类型表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| code | TEXT | 字典类型代码（如：gender、position） |
| name | TEXT | 字典类型名称（如：性别、职位） |
| description | TEXT | 字典类型描述 |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## dict_items（字典项表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| type_code | TEXT | 所属字典类型代码 |
| label | TEXT | 显示标签 |
| value | TEXT | 实际值 |
| sort | INTEGER | 排序号 |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## roles（角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| code | TEXT | 角色代码（如：sysadmin、admin、hr、user） |
| name | TEXT | 角色名称（如：超级管理员、管理员、人事专员、普通用户） |
| description | TEXT | 角色描述 |
| is_system | INTEGER | 是否系统角色，0-否，1-是（系统角色不可删除） |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## permissions（权限表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| code | TEXT | 权限代码（如：menu:employee、emp:add） |
| name | TEXT | 权限名称（如：员工管理菜单、新增员工） |
| type | TEXT | 权限类型（menu-菜单权限，button-按钮权限） |
| description | TEXT | 权限描述 |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |
| updated_by | INTEGER | 修改人ID |
| updated_at | INTEGER | 修改时间（Unix时间戳） |

## role_permissions（角色权限关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| role_id | INTEGER | 角色ID |
| permission_code | TEXT | 权限代码 |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |

## user_roles（用户角色关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（员工ID） |
| role_id | INTEGER | 角色ID |
| is_deleted | INTEGER | 是否删除，0-未删除，1-已删除 |
| created_by | INTEGER | 创建人ID |
| created_at | INTEGER | 创建时间（Unix时间戳） |

## operation_logs（操作日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 操作用户ID |
| user_name | TEXT | 操作用户名称 |
| module | TEXT | 操作模块（如：员工管理、部门管理） |
| action | TEXT | 操作动作（如：新增、编辑、删除） |
| target_type | TEXT | 操作对象类型（如：员工、部门） |
| target_id | INTEGER | 操作对象ID |
| target_name | TEXT | 操作对象名称 |
| detail | TEXT | 操作详情（JSON格式） |
| ip | TEXT | 操作IP地址 |
| created_at | INTEGER | 创建时间（Unix时间戳） |