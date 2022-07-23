import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { areHookInputsEqual, HookLayout, HookPassive } from "./utils"

let currentlyRenderingFiber = null  // 当前工作的fiber
let workInProgressHook = null //当前工作的hook，加新的hook或执行hook时就不用重新便利了
let currentHook = null // 老hook，用于比较前后依赖项

// 获取当前Fiber，赋初始值为null，后面每次更新
export function renderWithHooks (wip) {
    currentlyRenderingFiber = wip
    currentlyRenderingFiber.memorizedState = null
    workInProgressHook = null

    // 源码中是链表，useEffect和useLayoutEffect是存在一起的
    currentlyRenderingFiber.updateQueueOfEffect = [] // 单独存effect
    currentlyRenderingFiber.updateQueueOfLayoutEffect = [] // 单独存layoutEffect
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
            currentHook = currentHook.next // 如果不是头hook，老hook对应老hook的next
        } else {
            // 第0个hook，取老hook，在老hook基础上更新
            workInProgressHook = hook = current.memorizedState
            currentHook = current.memorizedState  // 如果是头hook，老hook对应老fiber的头hook
        }
    } else {
        // 组件初次渲染，初始化当前hook
        currentHook = null // 初次渲染没有老hook
        hook = {
            memorizedState: null,  // 存状态值(useState)或副作用(useEffect)
            next: null,
        }
        // 判断当前是第几个hook，挂载到连表结构上
        if(workInProgressHook) {
            // 重新记录当前正在工作的hook，维护hook链表
            workInProgressHook = workInProgressHook.next = hook
        } else {
            // 第0个hook
            workInProgressHook = currentlyRenderingFiber.memorizedState = hook
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

    // const dispatch = () => {
    //     // 传进来的reduce接受上一次的状态，返回新状态，从而修改状态值
    //     hook.memorizedState = reducer(hook.memorizedState)
    //     // 这里不对，首次渲染完毕后，currentlyRenderingFiber会一直指向最后一个Fiber
    //     // 当有多个节点的时候更新的永远是最后一个组件的状态
    //     currentlyRenderingFiber.alternate = {...currentlyRenderingFiber}  //获取老fiber进行对比更新
    //     scheduleUpdateOnFiber(currentlyRenderingFiber)  // 和初次渲染是同一个方法
    // }

    const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, hook, reducer)

    // 返回最新的状态值 和 设置的方法
    return [hook.memorizedState, dispatch]
}

function dispatchReducerAction(fiber, hook, reducer, action) {
    // 传进来的reduce接受上一次的状态，返回新状态，从而修改状态值
    hook.memorizedState = reducer ? reducer(hook.memorizedState) : action
    currentlyRenderingFiber.alternate = {...currentlyRenderingFiber}  //获取老fiber进行对比更新
    fiber.sibling = null  
    scheduleUpdateOnFiber(currentlyRenderingFiber)  // 和初次渲染是同一个方法
}

// 和useReducer一样，只不过没有reducer这个参数
export function useState(initialState) {
    return useReducer(null, initialState)
}

// 在源码上，除了hook链表上有，还把effect单独放在了另一个结构里
function updateEffectImp(hooksFlag, create, deps) {
    const hook = updateWorkInProgressHook()
    const effect = {hooksFlag, create, deps}

    // 找到老hook，才能比较前后两个hook的依赖项是否变化
    if(currentHook) {
        const prevEffect = currentHook.memorizedState
        // 有依赖项，前后两次比较
        if(deps) {
            const prevDeps = prevEffect.deps
            if(areHookInputsEqual(deps, prevDeps)) {
                // 依赖项一样，不执行了
                return 
            } else {

            }
        }
    }

    // 将hook存到fiber的链表结构上
    hook.memorizedState = effect
    if(hooksFlag & HookPassive) {
        currentlyRenderingFiber.updateQueueOfEffect.push(effect)
    } else if(hooksFlag & HookLayout) {
        currentlyRenderingFiber.updateQueueOfLayoutEffect.push(effect)
    }

}

// 组件渲染到屏幕之后延迟执行
export function useEffect(create, deps) {
    // 第一个参数用于区分 useEffect 和 useLayoutEffect
    return updateEffectImp(HookPassive, create, deps)
}

// DOM变更后同步执行
export function useLayoutEffect(create, deps) {
    return updateEffectImp(HookLayout, create, deps)
}
