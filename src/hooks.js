import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"

let currentlyRenderingFiber = null  // 当前工作的fiber
let workInProgressHook = null //当前工作的hook，加新的hook或执行hook时就不用重新便利了

// 获取当前Fiber，赋初始值为null，后面每次更新
export function renderWithHooks (wip) {
    currentlyRenderingFiber = wip
    currentlyRenderingFiber.memorizedState = null
    workInProgressHook = null
}

// 获取当前工作的hook
function updateWorkInProgressHook(){
    let hook
    const current = currentlyRenderingFiber.alternate // 老fiber
    if(current) {
        // 组件更新
        // 在老Fiber的基础上更新hook链表
        currentlyRenderingFiber.memorizedState = current.memorizedState
        // 判断当前是第几个hook，挂载到连表结构上
        if(workInProgressHook) {
            // workInProgressHook是上一次的hook，这一次的hook是workInProgressHook的下一个
            workInProgressHook = hook = workInProgressHook.next
        } else {
            // 第0个hook，取老hook，在老hook基础上更新
            workInProgressHook = hook = current.memorizedState
        }
    } else {
        // 组件初次渲染，初始化当前hook
        hook = {
            memorizedState: null,
            next: null,
        }
        // 判断当前是第几个hook，挂载到连表结构上
        if(workInProgressHook) {
            // 重新记录当前正在工作的hook，维护hook链表
            workInProgressHook = workInProgressHook.next = hook
        } else {
            // 第0个hook
            currentlyRenderingFiber.memorizedState = hook
        }
    }
    return hook
}

// hooks存到使用它的函数组件的Fiber上
export function useReducer(reducer, initialState) {
    const hook = updateWorkInProgressHook()  // 获取当前的hook

    if(!currentlyRenderingFiber.alternate) {
        // 初次渲染
        hook.memorizedState = initialState
    }
    const dispatch = () => {
        // 传进来的reduce接受上一次的状态，返回新状态，从而修改状态值
        hook.memorizedState = reducer(hook.memorizedState)
        currentlyRenderingFiber.alternate = {...currentlyRenderingFiber}  //获取老fiber进行对比更新
        scheduleUpdateOnFiber(currentlyRenderingFiber)  // 和初次渲染是同一个方法
    }
    // 返回最新的状态值 和 设置的方法
    return [hook.memorizedState, dispatch]
}
