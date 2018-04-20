import Vue from 'vue'
import AV from 'leancloud-storage'

var APP_ID = 'k26byE1714UktS5mNEj7mfD6-gzGzoHsz'
var APP_KEY = '04Npj3N0XBqqkmmlhsFkEfkN'

AV.init({
  appId: APP_ID,
  appKey: APP_KEY
})

var app = new Vue({
    el: '#app',
    data: {
        todoId: 0,
        newTodo: '',
        // 所有待办事项的容器
        todoList: [],
        actionType: 'signUp',
        // 表单信息
        formData: {
          username: '',
          password: ''
        },
        // 当前登录用户
        currentUser: null,
    },
    created() {
        // 获取 User 的 AllTodos 用于读取
        this.currentUser = this.getCurrentUser()
        this.fetchTodos()
    },
    methods: {
        fetchTodos() {
            if(this.currentUser) {
                var query = new AV.Query('AllTodos')
                query.find().then((todos) => {
                    let avAllTodos = todos[0]
                    let id = avAllTodos.id
                    this.todoList = JSON.parse(avAllTodos.attributes.content)
                    this.todoList.id = id
                }, (error) => {
                    console.error(error)
                })
            }
        },
        updateTodos() {
            console.log('序列化有 id 的数组之前', this.todoList)
            let dataString = JSON.stringify(this.todoList)
            console.log('序列化有 id 的数组之后', dataString)
            console.log('updataTodos todoList', this.todoList, this.todoList.id)
            let AVTodos = AV.Object.createWithoutData('AllTodos', this.todoList.id)
            AVTodos.set('content', dataString)
            AVTodos.save().then(() => {
                console.log('更新成功')
            })
        },
        saveTodos() {
            let dataString = JSON.stringify(this.todoList)
            var AVTodos = AV.Object.extend('AllTodos')
            var avTodos = new AVTodos()
            var acl = new AV.ACL()
            acl.setReadAccess(AV.User.current(), true) // 只有这个 user 能读
            acl.setWriteAccess(AV.User.current(), true) // 只有这个 user 能写

            avTodos.set('content', dataString)
            avTodos.setACL(acl) // 设置访问控制
            avTodos.save().then((todo) => {
                console.log('save 时 todo 是什么？', todo, 'todo.id 是什么？', todo.id)
                console.log('save 时，todoList 什么样？', this.todoList)
                this.todoList.id = todo.id
                console.log('保存/删除 成功')
            }, (error) => {
                // 异常处理
                console.error('保存/删除 失败')
            })
        },
        saveOrUpdateTodos() {
            console.log('this.todoList.id 是', this.todoList.id, 'this.todoList', this.todoList)
            if(this.todoList.id) {
                this.updateTodos()
            } else {
                this.saveTodos()
            }
        },
        addTodo() {
            this.todoList.push({
                    id: this.todoId,
                    title: this.newTodo,
                    createdAt: new Date(),
                    done: false
                })
            this.newTodo = ''
            this.saveOrUpdateTodos()
        },
        removeTodo(todo) {
            // 找到被点击 todo 在 todoList 中的下标
            let index = this.todoList.indexOf(todo)
            // 删除
            this.todoList.splice(index, 1)
            this.saveOrUpdateTodos()
        },
        finish(todo) {
            let index = this.todoList.indexOf(todo)
            this.todoList[index].done = !this.todoList[index].done
            this.updateTodos()
        },
        signUp() {
            // 新建 AVUser 对象实例
            let user = new AV.User()
            // 设置用户名
            user.setUsername(this.formData.username)
            // 设置密码
            user.setPassword(this.formData.password)
            user.signUp().then((loginedUser) => {
                this.currentUser = this.getCurrentUser()
            }, (error) => {
                alert('注册失败')
            })
        },
        login() {
            AV.User.logIn(this.formData.username, this.formData.password).then((loginedUser) => {
            this.currentUser = this.getCurrentUser()
            // 登录成功后读取 todos
            this.fetchTodos()
            }, (error) => {
                alert('登录失败')
                console.log(error)
            })
        },
        // 得到当前登录状态
        getCurrentUser() {
            // AV.User.current() 可以获取当前登录的用户
            var current = AV.User.current()
            if (current) {
                let {id, createdAt, attributes: {username}} = current
                return {id, username, createdAt}
            } else {
                return null
            }
        },
        // 登出
        logout() {
            AV.User.logOut()
            // 清空状态
            this.currentUser = null
            // 刷新页面
            window.location.reload()
        },
    }
})
