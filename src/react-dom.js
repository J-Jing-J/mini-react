import { createFiber } from "./ReactFiber"
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"

// 创建root对象的构造函数
function ReactDOMRoot(internalRoot) {
  // 挂到this上，连接render函数
  this._internalRoot = internalRoot
}

ReactDOMRoot.prototype.render = function (children) {
  // children就是vnode, 但react工作靠的是fiber，不是vnode，还要createFiber
  const root = this._internalRoot
  // 从vnode更新到真实的dom
  updateContainer(children, root)
}

function updateContainer (element, container) {
  const {containerInfo} = container
  // 渲染需要先创建fiber结构
  // container不需要更新，第二个参数父节点自己创建
  // 初次渲染先创建根结点的fiber结构
  const fiber = createFiber(element, {
    type: containerInfo.nodeName.toLocaleLowerCase(),
    stateNode: containerInfo // 最终要更新到dom节点里
  })
  // 组件初次渲染
  scheduleUpdateOnFiber(fiber)
}

// container就是getElementById("root")
function createRoot(container) {
  const root = {containerInfo: container}
  return new ReactDOMRoot(root)
}

export default {createRoot}