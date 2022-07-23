import { func } from "prop-types";
import { updateClassComponent, updateFragmentComponent, updateFunctionComponent, updateHostComponent, updateHostTextComponent } from "./ReactFiberReconciler";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostText } from "./ReactWorkTags"
import { scheduleCallback } from "./scheduler";
import { Placement, Update, updateNode } from "./utils";

let wip = null // work in progress 正在执行的fiber

// 记录根节点，避免遍历时节点变化找不到根节点
let wipRoot = null

// 初次渲染/更新
export function scheduleUpdateOnFiber(fiber) {
  // 传进来的fiber是一开始要渲染的
  // 所有的fiber更新完要渲染到dom节点里
  wip = fiber;
  wipRoot = fiber

  // 任务调度 接收task要执行的callback作为参数
  scheduleCallback(workLoop)
}

// 更显当前组件
export function performUnitOfWork () {
  const {tag} = wip  // 不同类型的组件更新方式不一样
  switch (tag) {
    case HostComponent:
      updateHostComponent(wip)
      break;
  
    case FunctionComponent:
      updateFunctionComponent()
      break;

    case ClassComponent:
      updateClassComponent()
      break;

    case Fragment:
      updateFragmentComponent()
      break;

    case HostText:
      updateHostTextComponent()
      break;

    default:
      break;
  }

  // 更新下一个 深度优先遍历
  //顺序：子、兄、上层的兄
  if(wip.child) {
    wip = wip.child
    return
  }

  let next = wip;

  while(wip) {
    if(wip.sibling) {
      wip = next.sibling
      return
    }
    next = next.return;
  }
}


function workLoop () {
  // timeRemaining浏览器当前的空闲时间
  while(wip) {
    performUnitOfWork()
  }
  if(!wip && wipRoot) {
    commitRoot()
  }
}

// // 在浏览器空闲时段调用函数，便于执行后台和低优先级工作，而不延迟关键事件
// requestIdleCallback(workLoop)

function commitRoot() {
  commitWorker(wipRoot)
  wipRoot = null // 防止commitRoot被多次执行
}

// 把vdom更新到dom里（初次渲染）
function commitWorker(wip) {

  if(!wip) return

  // 1.提交自己
  const {flag, stateNode} = wip
  const parentNode = wip.return.stateNode  // 不合理，有的组建没有dom节点，比如函数节点
  // stateNode判断是否有dom节点，比如function没有dom节点
  if(flag & Placement && stateNode) {
    const before = getHostSibling(wip.sibling) // 找一个后面的dom节点，这样插在它前面就可以了
    insertOrAppendPlacement(stateNode, before, parentNode)  // 判断是append还是insert
    // parentNode.appendChild(stateNode)
  }
  if(flag & Update && stateNode) {
    // 更新属性
    updateNode(stateNode, wip.alternate.props, wip.props)
  }

  if(wip.deletions) {
    // 删除当前节点上需要删除的子节点，从当前的dom节点上删除，如果不是dom，就找父dom
    commitDeletions(wip.deletions, stateNode || parentNode)
  }

  
  if(wip.tag === FunctionComponent) {
    // 如果是函数组件，需要在commit之后处理副作用
    invokeHooks(wip) 

  }

  // 2. 提交子节点
  commitWorker(wip.child)
  // 3. 提交兄弟
  commitWorker(wip.sibling)
}

// 删除当前节点上需要删除的子节点
function commitDeletions(deletions, parentNode) {
  for (let i = 0; i < deletions.length; i++) {
    // 要删除的是dom节点，但是不是每一个fiber都有dom节点
    parentNode.removeChild(getStateNode(deletions[i]))
  }
}

// 获取dom节点，不是每个fiber都有dom节点
function getStateNode(fiber) {
  let temp = fiber

  while(!temp.stateNode) {
    // 当前节点没有dom节点，向子节点找
    temp = temp.child
  }
  return temp.stateNode
}

// 找一个后面的dom节点，这样插在它前面就可以了
function getHostSibling(sibling) {
  while(sibling) {
    if(sibling & stateNode && !(sibling.flag & Placement)) {
      return sibling.stateNode
    }
    sibling = sibling.sibling
  }
  return null
}

function insertOrAppendPlacement(stateNode, before, parentNode) {
  if(before) {
    // 如果找到了后面的一个dom节点，就在它前面插入
    // (如果每次都appendChild，每次都添加在父节点子节点的最后面，后面没有dom结构的时候才appendChild)
    parentNode.insertBefore(stateNode, before)
  } else {
    parentNode.appendChild(stateNode)
  }
}

function invokeHooks(wip) {
  const {updateQueueOfEffect, updateQueueLayoutEffect} = wip

  // useLayoutEffect在DOM变更后同步执行
  for (let i = 0; i < updateQueueLayoutEffect.length; i++) {
    const effect = updateQueueLayoutEffect[i];
    // 执行挂载到effect对象上的create函数
    effect.create()
  }

  // useEffect异步执行
  for (let i = 0; i < updateQueueOfEffect.length; i++) {
    const effect = updateQueueOfEffect[i];
    // 利用宏任务异步执行
    scheduleCallback(() => {
      effect.create()
    })
  }
}