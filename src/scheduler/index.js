import { peek, pop, push } from "./minHeap"

let taskQueue = []
let taskIdCounter = 1  // 记录区分任务

export function scheduleCallback(callback) {
    const currentTime = getCurrentTime()
    const timeout = -1 // 优先级
    const expirationTime = currentTime - timeout  // 过期时间

    const newTask = {
        id: taskIdCounter++, // 执行完加，区分任务
        callback,
        expirationTime,
        sortIndex: expirationTime,
    }
    // 放入任务池
    push(taskQueue, newTask)
    // 请求调度
    requestHostCallback()
}

// 提前创建好了宏任务，执行postMessage通知执行
function requestHostCallback() {
    port.postMessage(null)
}

const channel = new MessageChannel()
const port = channel.port2;
// 用port1监听
channel.port1.onmessage = function() {
    workLoop()
}

// react源码中还判断了 当前执行时间，是否执行完
function workLoop() {
    // 获取到优先级最高的任务
    let currentTask = peek(taskQueue);
    while(currentTask) {
        const callback = currentTask.callback
        currentTask.callback = null  // 写在while循环里，要防止重复执行
        callback()
        pop(taskQueue) // 执行完删掉任务
        currentTask = peek(taskQueue)
    }
}

export function getCurrentTime() {
    return performance.now()
}