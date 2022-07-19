import { updateClassComponent, updateFragmentComponent, updateFunctionComponent, updateHostComponent, updateHostTextComponent } from "./ReactFiberReconciler";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostText } from "./ReactWorkTags"
import { Placement } from "./utils";

let wip = null // work in progress 正在执行的fiber

// 记录根节点，避免遍历时节点变化找不到根节点
let wipRoot = null

// 初次渲染/更新
export function scheduleUpdateOnFiber(fiber) {
  // 传进来的fiber是一开始要渲染的
  // 所有的fiber更新完要渲染到dom节点里
  wip = fiber;
  wipRoot = fiber
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

function workLoop (idleDeadLine) {
  // timeRemaining浏览器当前的空闲时间
  while(wip && idleDeadLine.timeRemaining() > 0) {
    performUnitOfWork()
  }
  if(!wip && wipRoot) {
    commitRoot()
  }
}

// 在浏览器空闲时段调用函数，便于执行后台和低优先级工作，而不延迟关键事件
requestIdleCallback(workLoop)

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
    parentNode.appendChild(stateNode)
  }
  // 2. 提交子节点
  commitWorker(wip.child)
  // 3. 提交兄弟
  commitWorker(wip.sibling)
}
