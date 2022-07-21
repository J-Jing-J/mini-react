import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, updateNode } from "./utils"

export function updateHostComponent(wip) {
    if (!wip.stateNode) {
        wip.stateNode = document.createElement(wip.type)
        updateNode(wip.stateNode, wip.props)
    }
    // props.children是jsx的，多子节点是数组，但子节点是对象或文本
    reconcileChildren(wip, wip.props.children)
}

export function updateFunctionComponent() {}
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
    for (let index = 0; index < newChildren.length; index++) {
        const newChild = newChildren[index];

        // jsx里写{null}占用节点但不渲染
        // 跳出去，不让previousNewFiber被重新赋值，从而拿到真实的第一个节点
        if(newChild === null) continue 
        const newFiber = createFiber(newChild, wip) 
        
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