import { renderWithHooks } from "./hooks";
import { reconcileChildren } from "./reactChildFiber";
import { updateNode } from "./utils"

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

