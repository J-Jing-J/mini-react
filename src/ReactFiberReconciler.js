import { renderWithHooks } from "./hooks";
import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, Update, updateNode } from "./utils"

export function updateHostComponent(wip) {
    if (!wip.stateNode) {
        wip.stateNode = document.createElement(wip.type)
        updateNode(wip.stateNode, wip.props)
    }
    // props.children是jsx的，多子节点是数组，但子节点是对象或文本
    reconcileChildren(wip, wip.props.children)
}

export function updateFunctionComponent(wip) {
    // 为了让函数的hooks文件拿到当前工作的Fiber
    renderWithHooks(wip)
}
export function updateClassComponent() {}
export function updateFragmentComponent() {}
export function updateHostTextComponent() {}

// 协调：核心是diff
function reconcileChildren(wip, children) {
    const previousNewFiber = null
    if(isStringOrNumber(children)) {
        return;
    }
    // 不区分children多少了，放到数组里
    const newChildren = isArray(children) ? children : [children]

    // 老Fiber的头节点
    const oldFiber = wip.alternate?.child  

    for (let index = 0; index < newChildren.length; index++) {
        const newChild = newChildren[index];

        // jsx里写{null}占用节点但不渲染
        // 跳出去，不让previousNewFiber被重新赋值，从而拿到真实的第一个节点
        if(newChild === null) continue 
        const newFiber = createFiber(newChild, wip) 
        
        // 新老节点比较，是否能复用
        const same = sameNode(newFiber, oldFiber)
        if(same) {
            Object.assign(newFiber, {
                stateNode: oldFiber.stateNode,
                alternate: oldFiber.alternate,
                flags: Update,
            })
        }
        // 在循环里，每次把oldFiber指向下一个
        if(oldFiber) {
            oldFiber = oldFiber.sibling
        }
        // 刚进来的时候是null，后面的每次遍历都会重新赋值
        // 不能用 index===0 判断，因为jsx里写{null}占用节点但不渲染
        if(previousNewFiber === null) {
            wip.child = newFiber
        } else {
            previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
    }
}

// 节点复用：同一层级、类型相同、key相同
function sameNode(a, b) {
    return a && b && a.type === b.type && a.key === b.key
}