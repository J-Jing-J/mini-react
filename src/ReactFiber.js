
import { FunctionComponent, HostComponent } from "./ReactWorkTags"
import { isFn, isStr, Placement } from "./utils"

// vnode通过jsx拿到
export const createFiber = (vnode, returnFiber) => {
  const fiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,  // React中区分了 更新前 更新后，这里不区分
    stateNode: vnode.stateNode, //不同类型的组件，stateNode不同 (原生dom节点 或 class实例)

    child: null,  // 第一个子fiber
    sibling: null,
    return: returnFiber,

    flags: Placement,  // 行为
    index: null, //记录节点在当前层级下的位置，用于diff，新节点是children数组，老节点是链表用index记录位置

    alternate: null, // oldFiber, 用于判断是否是初次渲染，初次渲染没有oldFiber

    memorizedState: null // 头hook（函数组件）
  }

  const {type} = vnode
  if(isStr(type)) { // 原生标签的type是元素名
    fiber.tag = HostComponent
  } else if (isFn(type)) {
    // 函数组件 或 类组件
    fiber.tag = FunctionComponent
  }

  return fiber
}